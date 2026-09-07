package io.github.meyer4.secondlook;

import android.Manifest;
import android.app.Notification;
import android.content.*;
import android.graphics.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import org.junit.Test;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import java.io.*;
import java.util.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=35, qualifiers="w411dp-h891dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@LooperMode(LooperMode.Mode.PAUSED)
public class SecurityAndUiTests {
    @Before public void calmVisuals(){SecondLookApp.prefs(RuntimeEnvironment.getApplication()).edit().putString("appearance","light").putBoolean("motion",false).commit();}
    @Test public void themeChangesKeepPrivateInputAndGeneratedPassword(){
        MainActivity activity=Robolectric.buildActivity(MainActivity.class).setup().get();
        activity.getWindow().getDecorView().findViewWithTag("nav-check").performClick();
        EditText input=activity.getWindow().getDecorView().findViewWithTag("check-input");input.setText("Private example kept only in this page");
        activity.getWindow().getDecorView().findViewWithTag("theme-toggle").performClick();
        EditText after=activity.getWindow().getDecorView().findViewWithTag("check-input");assertEquals("Private example kept only in this page",after.getText().toString());assertTrue(NativeUi.DARK);
        activity.getWindow().getDecorView().findViewWithTag("nav-passwords").performClick();TextView password=activity.getWindow().getDecorView().findViewWithTag("generated-password");String previous=password.getText().toString();
        activity.getWindow().getDecorView().findViewWithTag("theme-toggle").performClick();password=activity.getWindow().getDecorView().findViewWithTag("generated-password");assertEquals(previous,password.getText().toString());assertFalse(NativeUi.DARK);
    }
    @Test public void backgroundVisualsRespectMotionSetting(){
        Context context=RuntimeEnvironment.getApplication();assertFalse(NativeUi.motionAllowed(context));
        SecondLookApp.prefs(context).edit().putBoolean("motion",true).commit();android.provider.Settings.Global.putFloat(context.getContentResolver(),android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,0f);assertFalse(NativeUi.motionAllowed(context));
    }

    @Test public void inputBoundariesDoNotCallUnboundedToString(){
        CharSequence hostile=new CharSequence(){public int length(){return 1000000;}public char charAt(int index){return 'a';}public CharSequence subSequence(int s,int e){throw new IllegalStateException();}public String toString(){throw new IllegalStateException("Never call this");}};
        assertEquals(12000,SafeText.bounded(hostile,12000).length());
        CharSequence broken=new CharSequence(){public int length(){throw new IllegalStateException();}public char charAt(int i){return 0;}public CharSequence subSequence(int s,int e){return this;}};
        assertEquals("",SafeText.bounded(broken,12000));
    }
    @Test public void joiningCannotAddAnExtraCharacterPastTheLimit(){
        assertEquals(12000,SafeText.joinBounded(Arrays.asList("a".repeat(12000),"b"),12000).length());
        assertEquals(11999,SafeText.joinBounded(Arrays.asList("a".repeat(11999),"b"),12000).length());
        assertTrue(SafeText.bounded("a\uD83D\uDE00",2).length()<=2);
    }
    @Test public void notificationPayloadsAreBoundedAndBadTypesDoNotCrash(){
        Notification notification=new Notification();notification.extras=new Bundle();
        Bundle a=new Bundle();a.putCharSequence("text","a".repeat(12000));Bundle b=new Bundle();b.putCharSequence("text","b");
        notification.extras.putParcelableArray(Notification.EXTRA_MESSAGES,new Parcelable[]{a,b});
        assertEquals(12000,NotificationText.extract(notification).length());
        notification.extras=new Bundle();notification.extras.putString(Notification.EXTRA_MESSAGES,"wrong type");
        assertNotNull(NotificationText.extract(notification));
    }
    @Test public void exportedShareRejectsMalformedInputAndKeepsCaptureProtection(){
        Intent intent=new Intent(Intent.ACTION_SEND);intent.putExtra(Intent.EXTRA_TEXT,new Bundle());
        MainActivity activity=Robolectric.buildActivity(MainActivity.class,intent).setup().get();
        assertTrue((activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_SECURE)!=0);
        assertNotNull(activity.findViewById(android.R.id.content));
    }
    @Test public void navigationAndPasswordControlsWork(){
        MainActivity activity=Robolectric.buildActivity(MainActivity.class).setup().get();
        activity.getWindow().getDecorView().findViewWithTag("nav-passwords").performClick();
        TextView password=activity.getWindow().getDecorView().findViewWithTag("generated-password");
        assertNotNull(password);assertEquals(20,password.getText().length());String first=password.getText().toString();
        activity.getWindow().getDecorView().findViewWithTag("generate-password").performClick();
        assertNotEquals(first,password.getText().toString());
        activity.getWindow().getDecorView().findViewWithTag("nav-check").performClick();
        EditText input=activity.getWindow().getDecorView().findViewWithTag("check-input");input.setText("Please send your OTP.");
        activity.getWindow().getDecorView().findViewWithTag("run-check").performClick();
        assertTrue(allText(activity.getWindow().getDecorView()).contains("Strong warning signs"));
        input.setText("Something else");assertFalse(allText(activity.getWindow().getDecorView()).contains("Strong warning signs"));
    }
    @Test public void renderAllNativeScreens() throws Exception {
        MainActivity activity=Robolectric.buildActivity(MainActivity.class).setup().get();
        for(String theme:new String[]{"light","dark"}){
            SecondLookApp.prefs(activity).edit().putString("appearance",theme).commit();
            for(String screen:new String[]{"home","check","passwords","guide","settings"}){
                activity.getWindow().getDecorView().findViewWithTag("nav-"+screen).performClick();capture(activity,screen+"-"+theme);
            }
        }
    }
    private static String allText(View view){StringBuilder text=new StringBuilder();if(view instanceof TextView)text.append(((TextView)view).getText());if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)text.append(allText(((ViewGroup)view).getChildAt(i)));return text.toString();}
    private static void capture(MainActivity activity,String name) throws Exception {
        Shadows.shadowOf(Looper.getMainLooper()).idle();
        View view=activity.getWindow().getDecorView();int width=822,height=1782;
        view.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));view.layout(0,0,width,height);
        Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);view.draw(new Canvas(bitmap));
        File dir=new File("build/preview-shots");dir.mkdirs();try(FileOutputStream file=new FileOutputStream(new File(dir,name+".png"))){bitmap.compress(Bitmap.CompressFormat.PNG,100,file);}
        bitmap.recycle();
    }
}
