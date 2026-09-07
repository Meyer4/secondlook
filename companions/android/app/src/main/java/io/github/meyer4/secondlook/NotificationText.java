package io.github.meyer4.secondlook;
import android.app.Notification;
import android.os.Bundle;
import android.os.Parcelable;
import java.util.LinkedHashSet;

final class NotificationText {
    static String extract(Notification notification) {
        if(notification==null)return "";
        try {
            Bundle extras=notification.extras;if(extras==null)return "";
            LinkedHashSet<String> pieces=new LinkedHashSet<>();
            Parcelable[] messages=extras.getParcelableArray(Notification.EXTRA_MESSAGES);
            if(messages!=null)for(int i=Math.max(0,messages.length-3);i<messages.length;i++) {
                if(messages[i] instanceof Bundle)pieces.add(SafeText.bounded(((Bundle)messages[i]).getCharSequence("text"),SafetyEngine.MAX_TEXT));
            }
            pieces.remove("");
            if(pieces.isEmpty()) {
                String big=SafeText.bounded(extras.getCharSequence(Notification.EXTRA_BIG_TEXT),SafetyEngine.MAX_TEXT);
                pieces.add(big.isEmpty()?SafeText.bounded(extras.getCharSequence(Notification.EXTRA_TEXT),SafetyEngine.MAX_TEXT):big);
            }
            return SafeText.joinBounded(pieces,SafetyEngine.MAX_TEXT);
        } catch(RuntimeException malformedExtras) {
            // An unreadable bundle must not crash the OS-bound listener. Never log it.
            return "";
        }
    }
}
