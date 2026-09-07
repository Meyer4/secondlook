package io.github.meyer4.secondlook;
import android.app.*;
import android.content.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public final class SecondLookApp extends Application {
    public static final String CHANNEL="secondlook_safety_alerts";
    private SafetyEngine engine;
    @Override public void onCreate() {
        super.onCreate();
        NotificationChannel channel=new NotificationChannel(CHANNEL,"Safety warnings",NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Private, local warnings from selected message notifications. No message text is included.");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
    public synchronized SafetyEngine engine() {
        if(engine==null)try(InputStream input=getAssets().open("rules.json");ByteArrayOutputStream output=new ByteArrayOutputStream()) {
            byte[] buffer=new byte[8192];int length;while((length=input.read(buffer))!=-1)output.write(buffer,0,length);
            engine=new SafetyEngine(new String(output.toByteArray(),StandardCharsets.UTF_8));
        }catch(Exception error){throw new IllegalStateException("Offline rules could not be loaded.",error);}
        return engine;
    }
    public static android.content.SharedPreferences prefs(Context context) { return context.getSharedPreferences("secondlook_settings",Context.MODE_PRIVATE); }
}
