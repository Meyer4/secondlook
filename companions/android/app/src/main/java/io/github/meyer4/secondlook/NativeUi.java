package io.github.meyer4.secondlook;

import android.app.Activity;
import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.*;
import android.graphics.drawable.*;
import android.os.Build;
import android.view.*;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.*;
import java.util.HashMap;
import java.util.Map;

/** Shared native design system. Theme-aware Prism surfaces, local fonts, and lifecycle-bound motion. */
final class NativeUi {
    static boolean DARK;
    static int INK, MUTED, PAPER, FOREST, SURFACE, BORDER, LIME, AMBER, RED;
    static int ACCENT_SURFACE, CYAN_SURFACE, ROSE_SURFACE, CYAN, ROSE;
    static boolean isDark(Context context) {
        String theme=SecondLookApp.prefs(context).getString("appearance","system");
        return theme.equals("dark") || theme.equals("system") && (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK)==android.content.res.Configuration.UI_MODE_NIGHT_YES;
    }
    static boolean motionAllowed(Context context) {
        if(!SecondLookApp.prefs(context).getBoolean("motion",true))return false;
        try{return android.provider.Settings.Global.getFloat(context.getContentResolver(),android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,1f)>0;}catch(RuntimeException error){return false;}
    }
    static void applyAppearance(Activity context) {
        DARK=isDark(context);
        INK=DARK?0xFFEEF3FF:0xFF202C54; MUTED=DARK?0xFFB8C7E1:0xFF596884;
        PAPER=DARK?0xFF0B1430:0xFFEAF0FC; FOREST=DARK?0xFF111E3C:0xFFF0F3FF;
        SURFACE=DARK?0xF5192949:0xF8FCFCFF; BORDER=DARK?0xFF3B4D74:0xFFCED8ED;
        LIME=DARK?0xFFB6C4FF:0xFF6257CD; AMBER=DARK?0xFFFFCE93:0xFF85551C; RED=DARK?0xFFFFB7CD:0xFFAB3654;
        ACCENT_SURFACE=DARK?0xFF343B66:0xFFEAE6FF; CYAN_SURFACE=DARK?0xFF1D435B:0xFFDAF2FA; ROSE_SURFACE=DARK?0xFF49354F:0xFFF8E5EF;
        CYAN=DARK?0xFF8BDEF0:0xFF116F8D; ROSE=DARK?0xFFF5BCD9:0xFF9F477D;
        context.setTheme(DARK?R.style.AppThemeDark:R.style.AppThemeLight);
        context.getWindow().setStatusBarColor(PAPER);context.getWindow().setNavigationBarColor(PAPER);
        int flags=DARK?0:View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if(!DARK&&Build.VERSION.SDK_INT>=27)flags|=View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        context.getWindow().getDecorView().setSystemUiVisibility(flags);
    }
    static void updateMotionVisibility(View view,boolean visible) {
        if(view instanceof PrismMotionView)((PrismMotionView)view).setForeground(visible);
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)updateMotionVisibility(((ViewGroup)view).getChildAt(i),visible);
    }
    private static final Map<Integer,Typeface> FONTS = new HashMap<>();

    interface Navigate { void go(String page); }
    static int dp(Context c, float value) { return Math.round(value*c.getResources().getDisplayMetrics().density); }
    static Typeface font(Context c, int weight) {
        if (!FONTS.containsKey(weight)) {
            try { FONTS.put(weight,new Typeface.Builder(c.getAssets(),"manrope-variable.ttf").setFontVariationSettings("'wght' "+weight).setWeight(weight).build()); }
            catch (RuntimeException ignored) { FONTS.put(weight,Typeface.create("sans-serif",weight>=600?Typeface.BOLD:Typeface.NORMAL)); }
        }
        return FONTS.get(weight);
    }
    static GradientDrawable shape(Context c,int color,int radius,int stroke) {
        GradientDrawable result=new GradientDrawable();result.setColor(color);result.setCornerRadius(dp(c,radius));
        if(stroke!=Color.TRANSPARENT)result.setStroke(dp(c,1),stroke);return result;
    }
    static GradientDrawable background(Context c,int color) { return shape(c,color,20,BORDER); }
    static Drawable ripple(Context c,int color,int radius) {
        return new RippleDrawable(ColorStateList.valueOf(0x386B82EF),shape(c,color,radius,BORDER),shape(c,Color.WHITE,radius,Color.TRANSPARENT));
    }
    static LinearLayout vertical(Context c) { LinearLayout view=new LinearLayout(c);view.setOrientation(LinearLayout.VERTICAL);return view; }
    static LinearLayout horizontal(Context c) { LinearLayout view=new LinearLayout(c);view.setOrientation(LinearLayout.HORIZONTAL);view.setGravity(Gravity.CENTER_VERTICAL);return view; }
    static void space(LinearLayout root,int height) { root.addView(new Space(root.getContext()),new LinearLayout.LayoutParams(1,dp(root.getContext(),height))); }
    static void gap(LinearLayout root,int width) { root.addView(new Space(root.getContext()),new LinearLayout.LayoutParams(dp(root.getContext(),width),1)); }
    static TextView label(Context c,String value,float size,int weight,int color) {
        TextView text=new TextView(c);text.setText(value);text.setTextSize(size);text.setTextColor(color);text.setTypeface(font(c,weight));
        text.setIncludeFontPadding(false);text.setLineSpacing(dp(c,3),1);return text;
    }
    static TextView text(LinearLayout root,String value,int size,boolean bold,int color) {
        TextView text=label(root.getContext(),value,size,bold?750:450,color);root.addView(text,new LinearLayout.LayoutParams(-1,-2));return text;
    }
    static void eyebrow(LinearLayout root,String value) {
        TextView view=label(root.getContext(),value.toUpperCase(java.util.Locale.ROOT),9,700,MUTED);view.setLetterSpacing(.13f);root.addView(view);
    }
    static void heading(LinearLayout root,String value,String supporting) {
        TextView title=text(root,value,30,true,INK);title.setLineSpacing(dp(root.getContext(),2),1);
        if(Build.VERSION.SDK_INT>=28)title.setAccessibilityHeading(true);
        space(root,10);text(root,supporting,13,false,MUTED);space(root,22);
    }
    static LinearLayout scaffold(Activity activity,String page,Navigate navigate) {
        applyAppearance(activity);
        activity.getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,WindowManager.LayoutParams.FLAG_SECURE);
        activity.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        FrameLayout stage=new FrameLayout(activity);stage.addView(new PrismBackdropView(activity),new FrameLayout.LayoutParams(-1,-1));
        LinearLayout shell=vertical(activity);shell.setTag("app-shell");stage.addView(shell,new FrameLayout.LayoutParams(-1,-1));
        if(Build.VERSION.SDK_INT>=30)shell.setOnApplyWindowInsetsListener((view,insets)->{
            Insets bars=insets.getInsets(WindowInsets.Type.systemBars());view.setPadding(bars.left,bars.top,bars.right,bars.bottom);return insets;
        }); else shell.setFitsSystemWindows(true);
        activity.setContentView(stage);
        LinearLayout brand=horizontal(activity);brand.setPadding(dp(activity,23),dp(activity,17),dp(activity,23),dp(activity,20));
        FrameLayout mark=new FrameLayout(activity);mark.setBackground(shape(activity,LIME,10,Color.TRANSPARENT));
        IconView eye=new IconView(activity,"eye",FOREST);FrameLayout.LayoutParams iconParams=new FrameLayout.LayoutParams(dp(activity,22),dp(activity,22),Gravity.CENTER);mark.addView(eye,iconParams);
        brand.addView(mark,new LinearLayout.LayoutParams(dp(activity,34),dp(activity,34)));gap(brand,9);
        TextView wordmark=label(activity,"SecondLook.",21,800,INK);brand.addView(wordmark,new LinearLayout.LayoutParams(0,-2,1));
        LinearLayout appearance=horizontal(activity);appearance.setPadding(dp(activity,10),dp(activity,8),dp(activity,10),dp(activity,8));appearance.setBackground(ripple(activity,SURFACE,12));appearance.setTag("theme-toggle");
        appearance.addView(new IconView(activity,DARK?"sun":"moon",LIME),new LinearLayout.LayoutParams(dp(activity,16),dp(activity,16)));gap(appearance,6);appearance.addView(label(activity,DARK?"Light":"Dark",11,700,INK));
        clickable(appearance,DARK?"Switch to light mode":"Switch to dark mode",()->{SecondLookApp.prefs(activity).edit().putString("appearance",DARK?"light":"dark").apply();if(activity instanceof MainActivity)((MainActivity)activity).refreshAppearance();else activity.recreate();});
        brand.addView(appearance);shell.addView(brand);
        ScrollView scroll=new ScrollView(activity);scroll.setFillViewport(true);scroll.setClipToPadding(false);scroll.setVerticalScrollBarEnabled(false);scroll.setTag("screen-scroll");
        shell.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        LinearLayout content=vertical(activity);content.setPadding(dp(activity,23),dp(activity,4),dp(activity,23),dp(activity,28));content.setTag("screen-content");scroll.addView(content);
        if(navigate!=null){
            LinearLayout nav=horizontal(activity);nav.setPadding(dp(activity,5),dp(activity,8),dp(activity,5),dp(activity,8));nav.setBackground(shape(activity,SURFACE,22,BORDER));
            LinearLayout.LayoutParams navParams=new LinearLayout.LayoutParams(-1,dp(activity,76));navParams.setMargins(dp(activity,14),dp(activity,6),dp(activity,14),dp(activity,12));shell.addView(nav,navParams);
            String[] pages={"home","check","passwords","guide","settings"};String[] names={"Home","Check","Passwords","Guide","Settings"};String[] icons={"home","scan","key","book","settings"};
            for(int i=0;i<pages.length;i++){
                final String target=pages[i];boolean active=page.equals(target);LinearLayout item=vertical(activity);item.setGravity(Gravity.CENTER);item.setPadding(dp(activity,2),dp(activity,4),dp(activity,2),0);item.setTag("nav-"+target);
                if(active)item.setBackground(shape(activity,ACCENT_SURFACE,14,Color.TRANSPARENT));
                item.addView(new IconView(activity,icons[i],active?LIME:MUTED),new LinearLayout.LayoutParams(dp(activity,21),dp(activity,21)));
                TextView name=label(activity,names[i],9,active?750:550,active?LIME:MUTED);name.setGravity(Gravity.CENTER);name.setMaxLines(2);LinearLayout.LayoutParams nameParams=new LinearLayout.LayoutParams(-1,-2);nameParams.topMargin=dp(activity,5);item.addView(name,nameParams);
                nav.addView(item,new LinearLayout.LayoutParams(0,-1,1));clickable(item,names[i],()->navigate.go(target));item.setSelected(active);
            }
        }
        return content;
    }
    static LinearLayout page(Activity activity,String eyebrow,String title) {
        LinearLayout root=scaffold(activity,"",null);eyebrow(root,eyebrow);space(root,14);heading(root,title,"A private, local second opinion.");return root;
    }
    static TextView pill(Context c,String value,int color) {
        TextView text=label(c,value,8,750,color);text.setLetterSpacing(.08f);text.setPadding(dp(c,9),dp(c,6),dp(c,9),dp(c,6));text.setBackground(shape(c,ACCENT_SURFACE,8,BORDER));return text;
    }
    static LinearLayout card(LinearLayout root) {
        Context c=root.getContext();LinearLayout card=vertical(c);card.setPadding(dp(c,18),dp(c,18),dp(c,18),dp(c,18));card.setBackground(shape(c,SURFACE,20,BORDER));card.setElevation(dp(c,3));
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.bottomMargin=dp(c,14);root.addView(card,params);return card;
    }
    static Button button(LinearLayout root,String value,Runnable action,boolean primary) {
        Context c=root.getContext();Button button=new Button(c);button.setText(value);button.setAllCaps(false);button.setTextSize(13);button.setTypeface(font(c,750));button.setTextColor(primary?FOREST:INK);button.setMinHeight(dp(c,50));button.setMinimumHeight(dp(c,50));button.setMinWidth(0);button.setMinimumWidth(0);button.setPadding(dp(c,15),dp(c,10),dp(c,15),dp(c,10));button.setBackground(ripple(c,primary?LIME:ACCENT_SURFACE,13));
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.topMargin=dp(c,13);root.addView(button,params);button.setOnClickListener(view->action.run());return button;
    }
    static void clickable(View view,String label,Runnable action) {
        view.setContentDescription(label);view.setFocusable(true);view.setClickable(true);view.setOnClickListener(v->action.run());
        view.setAccessibilityDelegate(new View.AccessibilityDelegate(){@Override public void onInitializeAccessibilityNodeInfo(View host,AccessibilityNodeInfo info){super.onInitializeAccessibilityNodeInfo(host,info);info.setClassName(Button.class.getName());}});
    }
    static void section(LinearLayout root,String title,String note) {
        LinearLayout row=horizontal(root.getContext());TextView heading=label(root.getContext(),title,17,750,INK);row.addView(heading,new LinearLayout.LayoutParams(0,-2,1));
        if(note!=null)row.addView(label(root.getContext(),note,10,550,MUTED));root.addView(row);space(root,13);
    }
    static LinearLayout iconTile(Context c,String icon,int color) {
        LinearLayout tile=horizontal(c);tile.setGravity(Gravity.CENTER);tile.setBackground(shape(c,ACCENT_SURFACE,12,Color.TRANSPARENT));tile.addView(new IconView(c,icon,color),new LinearLayout.LayoutParams(dp(c,20),dp(c,20)));return tile;
    }
    static void action(LinearLayout root,String icon,String title,String description,Runnable action) {
        Context c=root.getContext();LinearLayout card=card(root);card.setOrientation(LinearLayout.HORIZONTAL);card.setGravity(Gravity.CENTER_VERTICAL);card.addView(iconTile(c,icon,LIME),new LinearLayout.LayoutParams(dp(c,40),dp(c,40)));gap(card,13);
        LinearLayout words=vertical(c);text(words,title,14,true,INK);space(words,4);text(words,description,11,false,MUTED);card.addView(words,new LinearLayout.LayoutParams(0,-2,1));gap(card,10);card.addView(new IconView(c,"arrow",MUTED),new LinearLayout.LayoutParams(dp(c,17),dp(c,17)));clickable(card,title,action);
    }
    static void footer(LinearLayout root) { space(root,13);TextView text=label(root.getContext(),"PRIVATE BY DEFAULT · BUILT BY MEYER4",8,700,MUTED);text.setLetterSpacing(.08f);text.setGravity(Gravity.CENTER);root.addView(text,new LinearLayout.LayoutParams(-1,-2)); }
    static final class Backdrop extends Drawable {
        private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
        @Override public void draw(Canvas canvas){Rect b=getBounds();canvas.drawColor(PAPER);paint.setShader(new RadialGradient(b.width()*.97f,b.height()*.05f,Math.max(1,b.width()*1.2f),new int[]{DARK?0x66385095:0x66848AED,0x00000000},null,Shader.TileMode.CLAMP));canvas.drawRect(b,paint);paint.setShader(null);paint.setColor(0x184477C4);paint.setStrokeWidth(1);for(int x=-b.height();x<b.width();x+=76)canvas.drawLine(x,0,x+b.height(),b.height(),paint);}
        @Override public void setAlpha(int value){} @Override public void setColorFilter(ColorFilter filter){} @Override public int getOpacity(){return PixelFormat.OPAQUE;}
    }
}
