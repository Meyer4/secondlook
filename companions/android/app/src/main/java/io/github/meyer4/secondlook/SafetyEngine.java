package io.github.meyer4.secondlook;

import org.json.*;
import java.net.URI;
import java.net.IDN;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

/** Offline, bounded, conservative checks. No Android services or network APIs. */
public final class SafetyEngine {
    public static final int MAX_TEXT = 12000, MAX_URL = 4096, MAX_LINKS = 10;
    public static final class Signal {
        public final String id, severity, title, detail;
        public Signal(String id, String severity, String title, String detail) {
            this.id=id; this.severity=severity; this.title=title; this.detail=detail;
        }
    }
    public static final class Result {
        public final String kind;
        public String hostname="";
        public boolean assumedHttps=false;
        public final List<Signal> signals=new ArrayList<>();
        public Result(String kind) { this.kind=kind; }
        public String level() {
            int medium=0;
            for(Signal signal:signals) { if(signal.severity.equals("high")) return "high"; if(signal.severity.equals("medium"))medium++; }
            return medium>=3 ? "high" : signals.isEmpty() ? "unknown" : "caution";
        }
        public String label() { return level().equals("high") ? "Strong warning signs" : level().equals("caution") ? "Worth a closer look" : "No common warning signs found"; }
        public String explanation() {
            return level().equals("high") ? "Pause before you click, pay, or share details. Verify the request through a channel you already trust. These patterns are not proof of a scam." : level().equals("caution") ? "Some details deserve a second look, but can also appear in legitimate content. Independently verify the request." : "The known patterns were not found. This does not mean the message or link is safe. Verify unexpected requests before acting.";
        }
    }
    private static final class Rule {
        final String id,severity,title,detail; final Pattern pattern; final boolean skipNegated;
        Rule(JSONObject json) throws JSONException {
            id=json.getString("id"); severity=json.getString("severity");title=json.getString("title");detail=json.getString("detail");
            pattern=Pattern.compile(json.getString("pattern"),Pattern.CASE_INSENSITIVE|Pattern.UNICODE_CASE);
            skipNegated=json.optBoolean("skipNegated",false);
        }
    }
    private final List<Rule> rules=new ArrayList<>();
    private final Set<String> shorteners=new HashSet<>();
    private final JSONArray brands;
    public final JSONArray playbook;
    private static final Pattern NEGATION=Pattern.compile("\\b(?:never|do\\s+not|don['’]t|should\\s+not|shouldn['’]t|will\\s+not|won['’]t|avoid)\\b[^,;.!?\\n]{0,65}$",Pattern.CASE_INSENSITIVE);
    private static final Pattern LINKS=Pattern.compile("(?:https?://|ftp://|javascript:|data:|file:///|www\\.)[^\\s<>\\\"`]+|\\b(?:[a-z\\d](?:[a-z\\d-]{0,61}[a-z\\d])?\\.)+[a-z]{2,63}(?:[/:?#][^\\s<>\\\"`]*)?",Pattern.CASE_INSENSITIVE);
    private static final Pattern HIDDEN=Pattern.compile("[\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF]");
    public SafetyEngine(String json) throws JSONException {
        JSONObject data=new JSONObject(json);JSONArray source=data.getJSONArray("messageRules");
        for(int i=0;i<source.length();i++)rules.add(new Rule(source.getJSONObject(i)));
        JSONArray shorts=data.getJSONArray("shorteners");for(int i=0;i<shorts.length();i++)shorteners.add(shorts.getString(i));
        brands=data.getJSONArray("brands");playbook=data.getJSONArray("playbook");
    }
    private static boolean belongs(String host,String domain) { return host.equals(domain)||host.endsWith("."+domain); }
    private static void add(Result result,String id,String severity,String title,String detail) { result.signals.add(new Signal(id,severity,title,detail)); }
    public Result checkMessage(String input) {
        String text=input==null?"":input.trim();
        if(text.isEmpty())throw new IllegalArgumentException("Paste or share a message first.");
        if(text.length()>MAX_TEXT)throw new IllegalArgumentException("Keep the text under 12,000 characters.");
        Result result=new Result("message");
        for(Rule rule:rules) {
            Matcher match=rule.pattern.matcher(text);
            while(match.find()) {
                String before=text.substring(Math.max(0,match.start()-80),match.start());
                if(rule.skipNegated&&NEGATION.matcher(before).find())continue;
                add(result,rule.id,rule.severity,rule.title,rule.detail);break;
            }
        }
        if(HIDDEN.matcher(text).find())add(result,"hidden-characters","low","Hidden formatting characters","Invisible or directional characters can be legitimate, but can also disguise words or addresses.");
        List<String> links=extractLinks(text);
        for(int i=0;i<Math.min(links.size(),MAX_LINKS);i++) {
            try { Result link=checkLink(links.get(i));for(Signal signal:link.signals)add(result,"link-"+i+"-"+signal.id,signal.severity,signal.title,signal.detail); }
            catch(IllegalArgumentException exception) { add(result,"uninspected-link","medium","A link could not be inspected","Ask for a complete address or check it separately. This is not a safety verdict."); }
        }
        if(links.size()>MAX_LINKS)add(result,"link-limit","low","Some links were not inspected","Only the first 10 recognised links in a message are inspected. Check the others separately.");
        return result;
    }
    public static List<String> extractLinks(String text) {
        LinkedHashSet<String> found=new LinkedHashSet<>();Matcher matcher=LINKS.matcher(text);
        while(matcher.find()) {
            if(matcher.start()>0&&String.valueOf(text.charAt(matcher.start()-1)).matches("[@\\w]"))continue;
            String value=matcher.group().replaceAll("[,.!?;:'\\\"]+$","");
            for(int i=0;i<8&&!value.isEmpty();i++) {
                char close=value.charAt(value.length()-1);char open=close==')'?'(':close==']'?'[':close=='}'?'{':0;
                if(open==0)break;int balance=0;for(char c:value.toCharArray()) {if(c==open)balance++;if(c==close)balance--;}
                if(balance>=0)break;value=value.substring(0,value.length()-1);
            }
            if(!value.isEmpty())found.add(value);
            if(found.size()>MAX_LINKS)break;
        }
        return new ArrayList<>(found);
    }
    public Result checkLink(String input) {
        String text=input==null?"":input.trim();
        if(text.isEmpty())throw new IllegalArgumentException("Share or paste one link first.");
        if(text.length()>MAX_URL)throw new IllegalArgumentException("Use a link shorter than 4,096 characters.");
        if(Pattern.compile("\\s").matcher(text).find())throw new IllegalArgumentException("Use Message check for text containing spaces.");
        Result result=new Result("link");
        boolean scheme=Pattern.compile("^[a-z][a-z\\d+.-]*:",Pattern.CASE_INSENSITIVE).matcher(text).find()&&!text.matches("^[^/:]+:\\d+(?:[/?#].*)?$");
        result.assumedHttps=!scheme;
        URI uri;
        try { uri=new URI(scheme?text:"https://"+text); }
        catch(Exception error) { add(result,"nonstandard-url","medium","A nonstandard address","The native URL parser cannot fully interpret this address. Verify the original address independently.");return result; }
        String protocol=uri.getScheme()==null?"":uri.getScheme().toLowerCase(Locale.ROOT);
        if(!protocol.equals("http")&&!protocol.equals("https")) { add(result,"non-web-scheme","high","This is not a normal web link","This address may open another application or run an instruction. SecondLook will not open it.");return result; }
        String authority=uri.getRawAuthority();
        if(authority==null||authority.isEmpty())throw new IllegalArgumentException("The address needs a website hostname.");
        if(authority.contains("@"))add(result,"userinfo","high","Text before @ can hide the destination","Text before @ is user information, not the website. Independently verify the hostname shown below.");
        String hostPort=authority.substring(authority.lastIndexOf('@')+1);
        String host=hostPort;
        if(hostPort.startsWith("[")) { int end=hostPort.indexOf(']'); if(end<0)throw new IllegalArgumentException("Invalid IPv6 address.");host=hostPort.substring(0,end+1); }
        else if(hostPort.lastIndexOf(':')>=0)host=hostPort.substring(0,hostPort.lastIndexOf(':'));
        if(host.endsWith("."))host=host.substring(0,host.length()-1);
        boolean unicode=!StandardCharsets.US_ASCII.newEncoder().canEncode(host);
        try { if(!host.startsWith("["))host=IDN.toASCII(host,IDN.USE_STD3_ASCII_RULES); }
        catch(Exception error) { add(result,"nonstandard-host","medium","A nonstandard hostname","The hostname has unusual encoding or characters. Native and browser parsers can differ; verify it independently."); }
        host=host.toLowerCase(Locale.ROOT);result.hostname=host;
        if(host.isEmpty())throw new IllegalArgumentException("The address needs a hostname.");
        if(protocol.equals("http"))add(result,"unencrypted","medium","An unencrypted connection","HTTP does not encrypt the connection. HTTPS is preferable but is not proof that a site is trustworthy.");
        if(host.matches("(?:0x[0-9a-f]+|\\d+)(?:\\.(?:0x[0-9a-f]+|\\d+)){0,3}")||host.startsWith("["))add(result,"ip-host","medium","A numeric address instead of a domain","Numeric addresses may be legitimate, but make the organisation harder to identify. A browser may normalise them differently.");
        if(host.equals("localhost")||host.endsWith(".localhost")||host.endsWith(".local"))add(result,"local-host","low","A local-device address","Use it only if you know which local service you intend to access.");
        if(unicode||host.contains("xn--"))add(result,"international-domain","low","An internationalised domain name","These domains are often legitimate. Similar-looking letters can also be misleading. Native and browser normalisation can differ.");
        if(HIDDEN.matcher(text).find())add(result,"hidden-characters","medium","Invisible or directional characters","Hidden characters can change how an address appears. Check the original destination carefully.");
        for(String shortener:shorteners)if(belongs(host,shortener)){add(result,"shortener","low","The final destination is hidden","This offline check cannot follow a link shortener. Ask for the full original address.");break;}
        for(int i=0;i<brands.length();i++) {
            JSONObject brand=brands.optJSONObject(i);String token=brand.optString("token");
            if(!Pattern.compile("(^|[.-])"+Pattern.quote(token)+"([.-]|$)").matcher(host).find())continue;
            boolean expected=false;JSONArray domains=brand.optJSONArray("domains");for(int j=0;j<domains.length();j++)if(belongs(host,domains.optString(j)))expected=true;
            if(!expected)add(result,"brand-"+token,"medium","Brand wording outside a usual domain","The hostname mentions "+brand.optString("name")+" but is outside our small, non-exhaustive domain reference list. Open the service independently.");
        }
        String path=uri.getPath()==null?"":uri.getPath();
        if(Pattern.compile("\\.(?:exe|msi|apk|scr|bat|cmd|ps1|vbs|dmg|pkg)(?:$|/)",Pattern.CASE_INSENSITIVE).matcher(path).find())add(result,"download","high","A link that looks like a software download","No file was downloaded or inspected. Only install software from a source you independently trust.");
        String query=uri.getRawQuery();
        if(query!=null)for(String pair:query.split("&")) {
            String[] parts=pair.split("=",2);if(parts.length!=2||!Arrays.asList("url","redirect","redirect_uri","redirect_url","next","continue","destination","target").contains(parts[0]))continue;
            try { String nested=URLDecoder.decode(parts[1],"UTF-8");URI destination=new URI(nested);if(destination.getHost()!=null&&!destination.getHost().equalsIgnoreCase(host)) {add(result,"possible-redirect","low","Another website appears inside the link","A parameter names a different website. We do not know whether the server will redirect there.");break;} } catch(Exception ignored) {}
        }
        return result;
    }
    public static String nextStep(Result result) {
        for(Signal signal:result.signals)if(signal.id.contains("mistaken-deposit"))return "Check your real balance in the official banking or mobile-money app. Ask the provider to handle any reversal. Do not send money to another number.";
        return "Open the organisation’s official app or call a number you already know. Do not click, pay, share secrets, or install software until the request is independently verified. If you already acted, open the playbook.";
    }
}
