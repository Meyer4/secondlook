package io.github.meyer4.secondlook;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/** Bounded, event-driven deduplication. Hashes remain only in process memory. */
public final class NotificationPolicy {
    private static final int LIMIT=128;
    private static final long TTL=10*60*1000L;
    private final LinkedHashMap<String,Long> seen=new LinkedHashMap<>();
    private final LinkedHashMap<String,Long> warnings=new LinkedHashMap<>();
    public synchronized boolean accept(String app,String notificationKey,String text,long now) {
        seen.entrySet().removeIf(entry -> now-entry.getValue()>TTL || now<entry.getValue());
        String key=digest(app+"\u0000"+notificationKey+"\u0000"+text);
        if(seen.containsKey(key))return false;
        seen.put(key,now);trim(seen);return true;
    }
    public synchronized boolean mayWarn(String app,long now,long cooldown) {
        Long last=warnings.get(app);
        if(last!=null&&now>=last&&now-last<cooldown)return false;
        warnings.put(app,now);trim(warnings);return true;
    }
    private static void trim(LinkedHashMap<String,Long> map) { while(map.size()>LIMIT)map.remove(map.keySet().iterator().next()); }
    private static String digest(String text) {
        try { byte[] hash=MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));return Base64.getEncoder().encodeToString(hash); }
        catch(Exception exception) { throw new IllegalStateException("SHA-256 unavailable",exception); }
    }
    public static boolean shouldWarn(SafetyEngine.Result result,boolean includeCaution) { return result.level().equals("high") || includeCaution&&result.level().equals("caution"); }
    public synchronized int retainedDigests() { return seen.size(); }
}
