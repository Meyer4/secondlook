package io.github.meyer4.secondlook;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.service.notification.*;
import java.util.*;
import java.util.concurrent.*;

/** OS-bound event listener. No polling, wake locks, network, or raw-text storage. */
public final class SecondLookListener extends NotificationListenerService {
    public static volatile boolean connected=false;
    private final NotificationPolicy policy=new NotificationPolicy();
    private ThreadPoolExecutor worker;
    @Override public void onCreate() {
        super.onCreate();
        worker=new ThreadPoolExecutor(1,1,20,TimeUnit.SECONDS,new ArrayBlockingQueue<>(32),new ThreadPoolExecutor.DiscardOldestPolicy());
        worker.allowCoreThreadTimeOut(true);
    }
    @Override public void onListenerConnected() { connected=true; }
    @Override public void onListenerDisconnected() { connected=false; }
    @Override public void onDestroy() { connected=false;if(worker!=null)worker.shutdownNow();super.onDestroy(); }
    @Override public void onNotificationPosted(StatusBarNotification sbn) {
        try {
        if(sbn==null||sbn.getPackageName().equals(getPackageName()))return;
        android.content.SharedPreferences prefs=SecondLookApp.prefs(this);
        if(!prefs.getBoolean("enabled",false))return;
        if(!prefs.getStringSet("apps",Collections.emptySet()).contains(sbn.getPackageName()))return;
        Notification notification=sbn.getNotification();
        if(notification==null||(notification.flags&Notification.FLAG_GROUP_SUMMARY)!=0)return;
        String text=extractText(notification);
        if(text.trim().isEmpty())return;
        long now=SystemClock.elapsedRealtime();
        if(!policy.accept(sbn.getPackageName(),sbn.getKey(),text,now))return;
        final String source=sbn.getPackageName();
        try { worker.execute(() -> checkAndWarn(source,text)); } catch(RejectedExecutionException ignored) { /* Bounded burst handling: no background retry loop. */ }
        } catch(RuntimeException malformedNotification) { /* Ignore unreadable framework input; never log it. */ }
    }
    static String extractText(Notification notification) { return NotificationText.extract(notification); }
    private void checkAndWarn(String source,String text) {
        android.content.SharedPreferences prefs=SecondLookApp.prefs(this);
        // Re-check controls after a queued task, so pausing stops pending analysis.
        if(!prefs.getBoolean("enabled",false)||!prefs.getStringSet("apps",Collections.emptySet()).contains(source))return;
        try {
            SafetyEngine.Result result=((SecondLookApp)getApplication()).engine().checkMessage(text);
            if(!NotificationPolicy.shouldWarn(result,prefs.getBoolean("caution",false)))return;
            NotificationManager manager=getSystemService(NotificationManager.class);
            if(!manager.areNotificationsEnabled())return;
            if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
            NotificationChannel channel=manager.getNotificationChannel(SecondLookApp.CHANNEL);
            if(channel!=null&&channel.getImportance()==NotificationManager.IMPORTANCE_NONE)return;
            if(!policy.mayWarn(source,SystemClock.elapsedRealtime(),prefs.getLong("cooldown",30000L)))return;
            String label=source;
            try {label=getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(source,0)).toString();}catch(Exception ignored){}
            ArrayList<String> titles=new ArrayList<>();for(SafetyEngine.Signal signal:result.signals)if(titles.size()<6&&!titles.contains(signal.title))titles.add(signal.title);
            Intent intent=new Intent(this,AlertActivity.class).putExtra("source",label).putStringArrayListExtra("reasons",titles);
            PendingIntent open=PendingIntent.getActivity(this,source.hashCode(),intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            Notification publicVersion=new Notification.Builder(this,SecondLookApp.CHANNEL).setSmallIcon(R.drawable.ic_notification).setContentTitle("SecondLook safety warning").setContentText("Open SecondLook to review a warning.").build();
            Notification warning=new Notification.Builder(this,SecondLookApp.CHANNEL).setSmallIcon(R.drawable.ic_notification).setContentTitle("SecondLook: pause before you act")
                .setContentText(label+" · "+titles.size()+" warning signs. Tap for next steps.").setContentIntent(open).setAutoCancel(true)
                .setCategory(Notification.CATEGORY_RECOMMENDATION).setVisibility(Notification.VISIBILITY_PRIVATE).setPublicVersion(publicVersion).setOnlyAlertOnce(false).build();
            // Re-check immediately before posting, including permission/selection changes.
            if(!prefs.getBoolean("enabled",false)||!prefs.getStringSet("apps",Collections.emptySet()).contains(source))return;
            manager.notify(source.hashCode(),warning);
        }catch(Exception ignored) { /* Never log message bodies or private links. A check may be missed. */ }
    }
}
