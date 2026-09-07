package io.github.meyer4.secondlook;
import android.app.*;
import android.content.*;
import android.os.Bundle;
import android.widget.LinearLayout;
import java.util.ArrayList;

public final class AlertActivity extends Activity {
    @Override public void onCreate(Bundle state){super.onCreate(state);render();}
    private void render(){
        LinearLayout root=NativeUi.page(this,"A private, local warning","Pause before you act.");
        String source=getIntent().getStringExtra("source");NativeUi.text(root,source==null?"A selected app’s notification matched a warning pattern.":source+" · notification warning",13,true,NativeUi.MUTED);NativeUi.space(root,17);
        LinearLayout card=NativeUi.card(root);NativeUi.text(card,"What stood out",18,true,NativeUi.INK);
        ArrayList<String> reasons=getIntent().getStringArrayListExtra("reasons");if(reasons!=null)for(String reason:reasons){NativeUi.space(card,10);NativeUi.text(card,"• "+reason,14,false,NativeUi.MUTED);}
        NativeUi.space(card,16);NativeUi.text(card,"This is not proof of a scam. Do not click, pay, or send secrets until you verify the request using a known official app or a saved number. SecondLook did not open or block the message.",14,false,NativeUi.MUTED);
        NativeUi.button(root,"Open the safety playbook",()->{startActivity(new Intent(this,MainActivity.class).putExtra("page","playbook"));finish();},true);
        NativeUi.button(root,"Close warning",this::finish,false);
        NativeUi.space(root,16);NativeUi.text(root,"The original message is not included or saved. Some notifications are hidden, redacted, suppressed, or unavailable. No warning is not a safe verdict.",12,false,NativeUi.MUTED);
    }
}
