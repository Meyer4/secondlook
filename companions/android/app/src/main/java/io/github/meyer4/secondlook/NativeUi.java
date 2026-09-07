package io.github.meyer4.secondlook;
import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.view.*;
import android.widget.*;

final class NativeUi {
    static final int INK=Color.rgb(31,48,38), MUTED=Color.rgb(92,111,77), PAPER=Color.rgb(246,247,242), LIME=Color.rgb(218,239,171), FOREST=Color.rgb(24,46,39);
    static int dp(Context c,int value){return Math.round(value*c.getResources().getDisplayMetrics().density);}
    static GradientDrawable background(Context c,int color){GradientDrawable shape=new GradientDrawable();shape.setColor(color);shape.setCornerRadius(dp(c,15));shape.setStroke(dp(c,1),Color.rgb(220,229,207));return shape;}
    static LinearLayout page(Activity activity,String eyebrow,String title){
        activity.getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,WindowManager.LayoutParams.FLAG_SECURE);
        ScrollView scroll=new ScrollView(activity);scroll.setBackgroundColor(PAPER);scroll.setFillViewport(true);
        LinearLayout root=new LinearLayout(activity);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(dp(activity,20),dp(activity,24),dp(activity,20),dp(activity,32));
        if(Build.VERSION.SDK_INT>=30)root.setOnApplyWindowInsetsListener((view,insets)->{android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());view.setPadding(dp(activity,20)+bars.left,dp(activity,22)+bars.top,dp(activity,20)+bars.right,dp(activity,28)+bars.bottom);return insets;});
        else root.setFitsSystemWindows(true);
        scroll.addView(root);activity.setContentView(scroll);
        text(root,"◉ SecondLook.",25,true,INK);text(root,eyebrow.toUpperCase(java.util.Locale.ROOT),10,true,MUTED);space(root,20);text(root,title,31,true,INK);space(root,15);return root;
    }
    static TextView text(LinearLayout root,String text,int size,boolean bold,int color){TextView view=new TextView(root.getContext());view.setText(text);view.setTextSize(size);view.setTextColor(color);view.setLineSpacing(dp(root.getContext(),3),1);if(bold)view.setTypeface(null,Typeface.BOLD);root.addView(view,new LinearLayout.LayoutParams(-1,-2));return view;}
    static LinearLayout card(LinearLayout root){LinearLayout card=new LinearLayout(root.getContext());card.setOrientation(LinearLayout.VERTICAL);card.setPadding(dp(root.getContext(),17),dp(root.getContext(),17),dp(root.getContext(),17),dp(root.getContext(),17));card.setBackground(background(root.getContext(),Color.WHITE));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.bottomMargin=dp(root.getContext(),14);root.addView(card,params);return card;}
    static Button button(LinearLayout root,String label,Runnable action,boolean primary){Button button=new Button(root.getContext());button.setText(label);button.setAllCaps(false);button.setTextSize(14);button.setTextColor(INK);button.setBackground(background(root.getContext(),primary?LIME:PAPER));button.setMinHeight(dp(root.getContext(),46));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.topMargin=dp(root.getContext(),11);root.addView(button,params);button.setOnClickListener(view->action.run());return button;}
    static void space(LinearLayout root,int height){Space space=new Space(root.getContext());root.addView(space,new LinearLayout.LayoutParams(1,dp(root.getContext(),height)));}
}
