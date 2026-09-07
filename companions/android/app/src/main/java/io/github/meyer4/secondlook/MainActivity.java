package io.github.meyer4.secondlook;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.provider.Settings;
import android.provider.Telephony;
import android.service.notification.NotificationListenerService;
import android.text.InputFilter;
import android.text.TextWatcher;
import android.text.Editable;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.util.*;

public final class MainActivity extends Activity {
    private String currentPage="home";
    private android.content.SharedPreferences prefs;
    private EditText checkInput;
    private LinearLayout resultArea;
    private boolean linkMode=false;
    private String generatedPassword="";
    private int passwordLength=20;
    private Button copyPassword;

    @Override public void onCreate(Bundle state){super.onCreate(state);prefs=SecondLookApp.prefs(this);handleIntent(getIntent());}
    @Override public void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);handleIntent(intent);}
    @Override public void onResume(){super.onResume();if(prefs!=null){if(currentPage.equals("home"))home();else if(currentPage.equals("settings"))settings();}NativeUi.updateMotionVisibility(getWindow().getDecorView(),true);}
    @Override public void onPause(){NativeUi.updateMotionVisibility(getWindow().getDecorView(),false);super.onPause();}
    void refreshAppearance(){
        String page=currentPage;
        String input=checkInput==null?"":SafeText.bounded(checkInput.getText(),SafetyEngine.MAX_TEXT);
        String password=generatedPassword;
        boolean previousLinkMode=linkMode;
        if(page.equals("check")){showCheck("",previousLinkMode);checkInput.setText(input);}
        else if(page.equals("passwords")){passwords();if(!password.isEmpty()){generatedPassword=password;TextView output=getWindow().getDecorView().findViewWithTag("generated-password");output.setText(password);}}
        else go(page);
    }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(currentPage.equals("settings"))settings();else if(currentPage.equals("home"))home();}

    private void handleIntent(Intent intent){
        try {
            CharSequence shared=null;
            if(Intent.ACTION_SEND.equals(intent.getAction()))shared=intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            else if(Intent.ACTION_PROCESS_TEXT.equals(intent.getAction()))shared=intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            if(shared!=null){String value=SafeText.bounded(shared,SafetyEngine.MAX_TEXT);showCheck(value,looksLikeLink(value));return;}
            String requested=SafeText.bounded(intent.getStringExtra("page"),30);
            if(requested.equals("playbook")||requested.equals("guide")){guide();return;}
        } catch(RuntimeException malformed){toast("That share could not be read. You can paste plain text in Check.");}
        home();
    }
    private boolean looksLikeLink(String text){String lower=text.trim().toLowerCase(Locale.ROOT);return (lower.startsWith("https://")||lower.startsWith("http://"))&&!text.contains("\n")&&!text.contains(" ");}
    private void go(String page){
        switch(page){case "check":showCheck("",false);break;case "passwords":passwords();break;case "guide":guide();break;case "settings":settings();break;default:home();}
    }
    private LinearLayout screen(String page){currentPage=page;return NativeUi.scaffold(this,page,this::go);}
    private void toast(String text){Toast.makeText(this,text,Toast.LENGTH_LONG).show();}
    private boolean hasAccess(){
        ComponentName component=new ComponentName(this,SecondLookListener.class);
        if(Build.VERSION.SDK_INT>=27)return getSystemService(NotificationManager.class).isNotificationListenerAccessGranted(component);
        String value=Settings.Secure.getString(getContentResolver(),"enabled_notification_listeners");return value!=null&&Arrays.asList(value.split(":")).contains(component.flattenToString());
    }
    private boolean canWarn(){
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return false;
        NotificationManager manager=getSystemService(NotificationManager.class);NotificationChannel channel=manager.getNotificationChannel(SecondLookApp.CHANNEL);
        return manager.areNotificationsEnabled()&&(channel==null||channel.getImportance()!=NotificationManager.IMPORTANCE_NONE);
    }
    private Set<String> selectedApps(){return prefs.getStringSet("apps",Collections.emptySet());}
    private void enabled(boolean value){
        prefs.edit().putBoolean("enabled",value).apply();
        if(!value)getSystemService(NotificationManager.class).cancelAll();
        else if(hasAccess())reconnect();
    }
    private void reconnect(){try{NotificationListenerService.requestRebind(new ComponentName(this,SecondLookListener.class));}catch(RuntimeException ignored){toast("Review notification access in Android settings.");}}
    private void openSettings(Intent intent){try{startActivity(intent);}catch(RuntimeException unavailable){toast("This settings screen is not available. Open SecondLook Preview’s app settings in Android.");}}

    private void home(){
        LinearLayout root=screen("home");NativeUi.eyebrow(root,"YOUR EVERYDAY SAFETY SPACE");NativeUi.space(root,11);
        NativeUi.heading(root,"A little more\npeace of mind.","Take the rush out of your digital life.");
        boolean on=prefs.getBoolean("enabled",false), access=hasAccess(), alerts=canWarn();int apps=selectedApps().size();boolean ready=access&&alerts&&apps>0;
        LinearLayout hero=NativeUi.card(root);
        GradientDrawable gradient=new GradientDrawable(GradientDrawable.Orientation.TL_BR,NativeUi.DARK?new int[]{0xFF2F3D71,0xFF1F3657}:new int[]{0xFFE5E1FE,0xFFE1F3FB});gradient.setCornerRadius(NativeUi.dp(this,21));gradient.setStroke(NativeUi.dp(this,1),NativeUi.BORDER);hero.setBackground(gradient);
        String status=!on?"PROTECTION PAUSED":!ready?"SETUP INCOMPLETE":!SecondLookListener.connected?"WAITING FOR ANDROID":"NOTIFICATION LISTENER CONNECTED";
        TextView badge=NativeUi.pill(this,status,on&&ready&&SecondLookListener.connected?NativeUi.LIME:NativeUi.AMBER);badge.setTag("protection-status");hero.addView(badge,new LinearLayout.LayoutParams(-2,-2));NativeUi.space(hero,17);
        LinearLayout heroBody=NativeUi.horizontal(this);LinearLayout words=NativeUi.vertical(this);
        NativeUi.text(words,!ready?"A clearer view.\nOn your terms.":on?"A quieter kind\nof protection.":"Ready when\nyou are.",24,true,NativeUi.INK);
        NativeUi.space(words,9);NativeUi.text(words,!ready?"Choose your apps and connect the permissions you’re comfortable with.":"Only available notification text is checked. Your messages stay on your device.",12,false,NativeUi.MUTED);
        heroBody.addView(words,new LinearLayout.LayoutParams(0,-2,1));NativeUi.gap(heroBody,10);heroBody.addView(new PrismOrbView(this),new LinearLayout.LayoutParams(NativeUi.dp(this,82),NativeUi.dp(this,107)));hero.addView(heroBody);
        NativeUi.button(hero,!ready?"Set up protection   →":on?"Pause notification checks":"Enable notification checks   →",()->{if(!ready)settings();else{enabled(!on);home();}},true).setTag("home-protection-action");
        LinearLayout stats=NativeUi.horizontal(this);root.addView(stats);
        stat(stats,Integer.toString(apps),"Apps selected","phone");NativeUi.gap(stats,9);stat(stats,((access?1:0)+(alerts?1:0))+" / 2","Permissions","shield");NativeUi.gap(stats,9);stat(stats,"Offline","Rule checks","lock");
        NativeUi.space(root,25);NativeUi.section(root,"Your everyday toolkit","QUICK ACTIONS");
        LinearLayout quick=NativeUi.horizontal(this);root.addView(quick);quickCard(quick,"scan","Check a message","A second opinion, in seconds.",()->showCheck("",false));NativeUi.gap(quick,11);quickCard(quick,"key","Make a password","Unique. Random. Only yours.",this::passwords);
        NativeUi.space(root,19);NativeUi.action(root,"help","Already clicked something?","Find your next safe step. No panic.",this::guide);
        LinearLayout note=NativeUi.card(root);NativeUi.eyebrow(note,"A GOOD RULE OF THUMB");NativeUi.space(note,9);NativeUi.text(note,"If it makes you rush,\nthat’s your cue to pause.",17,true,NativeUi.INK);NativeUi.space(note,9);NativeUi.text(note,"No warning does not mean safe. Hidden notifications, in-app links, and OS restrictions can limit coverage.",11,false,NativeUi.MUTED);
        NativeUi.footer(root);
    }
    private void stat(LinearLayout row,String value,String caption,String icon){
        LinearLayout tile=NativeUi.vertical(this);tile.setPadding(NativeUi.dp(this,12),NativeUi.dp(this,14),NativeUi.dp(this,10),NativeUi.dp(this,14));tile.setBackground(NativeUi.background(this,NativeUi.SURFACE));tile.setMinimumHeight(NativeUi.dp(this,108));
        tile.addView(new IconView(this,icon,NativeUi.MUTED),new LinearLayout.LayoutParams(NativeUi.dp(this,16),NativeUi.dp(this,16)));NativeUi.space(tile,12);NativeUi.text(tile,value,value.equals("Offline")?17:21,true,NativeUi.INK);NativeUi.space(tile,5);NativeUi.text(tile,caption,9,false,NativeUi.MUTED);row.addView(tile,new LinearLayout.LayoutParams(0,-2,1));
    }
    private void quickCard(LinearLayout row,String icon,String title,String subtitle,Runnable action){
        LinearLayout tile=NativeUi.vertical(this);tile.setPadding(NativeUi.dp(this,16),NativeUi.dp(this,18),NativeUi.dp(this,15),NativeUi.dp(this,18));tile.setBackground(NativeUi.ripple(this,NativeUi.SURFACE,19));
        tile.addView(NativeUi.iconTile(this,icon,NativeUi.LIME),new LinearLayout.LayoutParams(NativeUi.dp(this,38),NativeUi.dp(this,38)));NativeUi.space(tile,17);NativeUi.text(tile,title,13,true,NativeUi.INK);NativeUi.space(tile,7);NativeUi.text(tile,subtitle,10,false,NativeUi.MUTED);row.addView(tile,new LinearLayout.LayoutParams(0,-2,1));NativeUi.clickable(tile,title,action);
    }

    private void showCheck(String initial,boolean useLink){
        linkMode=useLink;LinearLayout root=screen("check");NativeUi.eyebrow(root,"PAUSE. CHECK. CARRY ON.");NativeUi.space(root,11);NativeUi.heading(root,"Trust your pause.","A private second look at something that feels off.");
        LinearLayout card=NativeUi.card(root);LinearLayout tabs=NativeUi.horizontal(this);tabs.setPadding(4,4,4,4);tabs.setBackground(NativeUi.background(this,NativeUi.FOREST));card.addView(tabs);
        Button message=segment(tabs,"Message",!linkMode),link=segment(tabs,"Link",linkMode);
        NativeUi.space(card,21);NativeUi.text(card,"What would you like to check?",13,true,NativeUi.INK);NativeUi.space(card,12);
        checkInput=new EditText(this);checkInput.setTag("check-input");checkInput.setHint("Paste a suspicious message or link…");checkInput.setTextSize(15);checkInput.setTypeface(NativeUi.font(this,450));checkInput.setTextColor(NativeUi.INK);checkInput.setHintTextColor(NativeUi.MUTED);checkInput.setGravity(Gravity.TOP);checkInput.setMinLines(5);checkInput.setPadding(NativeUi.dp(this,14),NativeUi.dp(this,15),NativeUi.dp(this,14),NativeUi.dp(this,15));checkInput.setBackground(NativeUi.shape(this,NativeUi.FOREST,13,NativeUi.BORDER));
        checkInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(SafetyEngine.MAX_TEXT)});checkInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE|android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);checkInput.setSaveEnabled(false);checkInput.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);checkInput.setText(initial);card.addView(checkInput,new LinearLayout.LayoutParams(-1,-2));
        NativeUi.space(card,11);TextView count=NativeUi.label(this,"",10,500,NativeUi.MUTED);card.addView(count);count.setText(checkInput.length()+" characters · not uploaded or saved");
        NativeUi.space(card,13);NativeUi.text(card,"Remove private access links, passwords, PINs, and security codes first.",11,false,NativeUi.MUTED);
        LinearLayout examples=NativeUi.horizontal(this);examples.setGravity(Gravity.TOP);card.addView(examples);Button example=compact(examples,"Try an example");NativeUi.gap(examples,8);Button paste=compact(examples,"Paste");NativeUi.gap(examples,8);Button clear=compact(examples,"Clear");
        Button analyse=NativeUi.button(card,linkMode?"Inspect this link   →":"Check this message   →",this::analyse,true);analyse.setTag("run-check");
        NativeUi.space(root,7);resultArea=NativeUi.vertical(this);resultArea.setTag("check-result");root.addView(resultArea);emptyResult();
        message.setOnClickListener(view->{linkMode=false;setSegment(message,true);setSegment(link,false);analyse.setText("Check this message   →");emptyResult();});
        link.setOnClickListener(view->{linkMode=true;setSegment(link,true);setSegment(message,false);analyse.setText("Inspect this link   →");emptyResult();});
        example.setOnClickListener(view->{checkInput.setText(linkMode?"https://paypal.com@verify-wallet.example/login":"Your parcel is on hold. Pay a redelivery fee today. Update your card details at https://parcel-redelivery.example/pay");analyse();});
        paste.setOnClickListener(view->paste());clear.setOnClickListener(view->{checkInput.setText("");emptyResult();});
        checkInput.addTextChangedListener(new TextWatcher(){public void beforeTextChanged(CharSequence s,int start,int count,int after){}public void onTextChanged(CharSequence s,int start,int before,int length){count.setText(s.length()+" characters · not uploaded or saved");emptyResult();}public void afterTextChanged(Editable s){}});
        NativeUi.footer(root);if(!initial.isEmpty())analyse();
    }
    private Button segment(LinearLayout row,String title,boolean selected){Button button=new Button(this);button.setText(title);button.setTextSize(12);button.setTypeface(NativeUi.font(this,700));button.setAllCaps(false);button.setMinHeight(0);button.setMinimumHeight(0);button.setPadding(0,0,0,0);setSegment(button,selected);row.addView(button,new LinearLayout.LayoutParams(0,NativeUi.dp(this,42),1));return button;}
    private void setSegment(Button button,boolean selected){button.setTextColor(selected?NativeUi.LIME:NativeUi.MUTED);button.setBackground(NativeUi.shape(this,selected?NativeUi.ACCENT_SURFACE:Color.TRANSPARENT,10,Color.TRANSPARENT));button.setSelected(selected);}
    private Button compact(LinearLayout row,String title){Button button=new Button(this);button.setMinHeight(0);button.setMinimumHeight(0);button.setIncludeFontPadding(false);button.setText(title);button.setTextSize(10);button.setTypeface(NativeUi.font(this,650));button.setAllCaps(false);button.setTextColor(NativeUi.MUTED);button.setBackground(NativeUi.ripple(this,NativeUi.FOREST,9));button.setMinWidth(0);button.setMinimumWidth(0);button.setPadding(NativeUi.dp(this,8),0,NativeUi.dp(this,8),0);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,NativeUi.dp(this,39),1);p.topMargin=NativeUi.dp(this,14);row.addView(button,p);return button;}
    private void paste(){
        try{ClipboardManager manager=getSystemService(ClipboardManager.class);ClipData data=manager.getPrimaryClip();if(data!=null&&data.getItemCount()>0){String value=SafeText.bounded(data.getItemAt(0).getText(),SafetyEngine.MAX_TEXT);if(!value.isEmpty()){checkInput.setText(value);return;}}}catch(RuntimeException ignored){}
        toast("No readable text was available. You can paste manually.");
    }
    private void emptyResult(){if(resultArea==null)return;resultArea.removeAllViews();LinearLayout card=NativeUi.card(resultArea);NativeUi.eyebrow(card,"YOUR SECOND OPINION");NativeUi.space(card,13);NativeUi.text(card,"Clarity starts here.",20,true,NativeUi.INK);NativeUi.space(card,8);NativeUi.text(card,"We’ll explain the patterns we find and suggest a practical next step. No result guarantees safety.",12,false,NativeUi.MUTED);}
    private void analyse(){
        if(resultArea==null||checkInput==null)return;resultArea.removeAllViews();LinearLayout card=NativeUi.card(resultArea);
        try {
            SafetyEngine engine=((SecondLookApp)getApplication()).engine();SafetyEngine.Result result=linkMode?engine.checkLink(checkInput.getText().toString()):engine.checkMessage(checkInput.getText().toString());
            int color=result.level().equals("high")?NativeUi.RED:result.level().equals("caution")?NativeUi.AMBER:NativeUi.MUTED;
            card.addView(NativeUi.pill(this,result.level().equals("unknown")?"CONTEXT STILL MATTERS":result.signals.size()+" WARNING SIGNS",color));NativeUi.space(card,15);NativeUi.text(card,result.label(),22,true,NativeUi.INK);NativeUi.space(card,10);NativeUi.text(card,result.explanation(),13,false,NativeUi.MUTED);
            if(!result.hostname.isEmpty()){NativeUi.space(card,18);NativeUi.eyebrow(card,"PARSED HOSTNAME · NOT A CLICKABLE LINK");NativeUi.space(card,8);NativeUi.text(card,result.hostname,15,true,NativeUi.LIME);if(result.assumedHttps)NativeUi.text(card,"HTTPS was assumed, not tested.",11,false,NativeUi.MUTED);}
            for(SafetyEngine.Signal signal:result.signals){NativeUi.space(card,19);NativeUi.text(card,signal.title,14,true,NativeUi.INK);NativeUi.space(card,5);NativeUi.text(card,signal.detail,12,false,NativeUi.MUTED);}
            NativeUi.space(card,22);NativeUi.eyebrow(card,"YOUR NEXT SAFE STEP");NativeUi.space(card,9);NativeUi.text(card,SafetyEngine.nextStep(result),13,false,NativeUi.MUTED);
            NativeUi.button(card,"Already acted? Open the guide   →",this::guide,false);
            NativeUi.space(card,14);NativeUi.text(card,"English-first rules. No live reputation, redirect, file, or website scan. Native and browser parsing can differ.",10,false,NativeUi.MUTED);
        }catch(Exception error){NativeUi.text(card,"Let’s check the input.",20,true,NativeUi.INK);NativeUi.space(card,9);NativeUi.text(card,error instanceof IllegalArgumentException?error.getMessage():"The local check could not run. Please try again.",13,false,NativeUi.AMBER);}
        resultArea.announceForAccessibility("Check complete. Review the result and its limitations.");
    }

    private void passwords(){
        LinearLayout root=screen("passwords");NativeUi.eyebrow(root,"ONE PASSWORD. ONE ACCOUNT.");NativeUi.space(root,11);NativeUi.heading(root,"Less guesswork.\nBetter passwords.","Make something unique. Keep it somewhere safe.");
        LinearLayout card=NativeUi.card(root);NativeUi.eyebrow(card,"GENERATED ONLY ON THIS DEVICE");NativeUi.space(card,19);
        TextView output=NativeUi.text(card,"",23,true,NativeUi.LIME);output.setTypeface(android.graphics.Typeface.MONOSPACE);output.setTextIsSelectable(true);output.setSaveEnabled(false);output.setTag("generated-password");
        NativeUi.space(card,20);TextView lengthLabel=NativeUi.text(card,passwordLength+" characters",13,true,NativeUi.INK);SeekBar length=new SeekBar(this);length.setMax(28);length.setProgress(passwordLength-12);length.setProgressTintList(android.content.res.ColorStateList.valueOf(NativeUi.LIME));length.setThumbTintList(android.content.res.ColorStateList.valueOf(NativeUi.LIME));card.addView(length,new LinearLayout.LayoutParams(-1,NativeUi.dp(this,48)));length.setContentDescription("Password length, from 12 to 40 characters");
        NativeUi.text(card,"Uppercase · lowercase · numbers · symbols",11,false,NativeUi.MUTED);NativeUi.space(card,8);NativeUi.text(card,"Similar-looking characters are left out.",11,false,NativeUi.MUTED);
        NativeUi.button(card,"Generate another   ↻",()->generate(output),true).setTag("generate-password");copyPassword=NativeUi.button(card,"Copy password",()->copyPassword(),false);copyPassword.setTag("copy-password");
        length.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){public void onStartTrackingTouch(SeekBar bar){}public void onStopTrackingTouch(SeekBar bar){}public void onProgressChanged(SeekBar bar,int progress,boolean user){passwordLength=progress+12;lengthLabel.setText(passwordLength+" characters");if(user)generate(output);}});
        generate(output);NativeUi.space(root,9);NativeUi.section(root,"The bigger picture",null);
        NativeUi.action(root,"lock","Save it in a password manager","One unique password for every account.",()->info("A manager can remember for you","A reputable password manager can generate and save long, unique passwords. SecondLook never stores the passwords it makes."));
        NativeUi.action(root,"shield","Add a second layer","Use a passkey or multi-factor authentication.",()->info("A password is only one layer","Use a passkey or multi-factor authentication where available. Never send someone a login code or recovery phrase."));
        NativeUi.text(root,"Copying puts the password on your device’s clipboard. It is marked sensitive, but other apps or clipboard history may still access it.",11,false,NativeUi.MUTED);NativeUi.footer(root);
    }
    private void generate(TextView output){try{generatedPassword=PasswordMaker.generate(passwordLength);output.setText(generatedPassword);copyPassword.setEnabled(true);}catch(RuntimeException error){generatedPassword="";output.setText("Could not generate securely.");copyPassword.setEnabled(false);}}
    private void copyPassword(){
        if(generatedPassword.isEmpty())return;
        ClipData clip=ClipData.newPlainText("Generated password",generatedPassword);PersistableBundle extras=new PersistableBundle();extras.putBoolean("android.content.extra.IS_SENSITIVE",true);clip.getDescription().setExtras(extras);getSystemService(ClipboardManager.class).setPrimaryClip(clip);toast("Copied. Save it in a password manager; be mindful of clipboard history.");
    }
    private void guide(){
        LinearLayout root=screen("guide");NativeUi.eyebrow(root,"PRACTICAL STEPS. NO BLAME.");NativeUi.space(root,11);NativeUi.heading(root,"You’re not\non your own.","Whatever happened, start with the next safe step.");
        try{JSONArray guides=((SecondLookApp)getApplication()).engine().playbook;for(int i=0;i<guides.length();i++){JSONObject item=guides.getJSONObject(i);final JSONObject selected=item;NativeUi.action(root,item.optString("icon","help"),item.getString("label"),item.optString("description","Open the step-by-step guide"),()->showGuide(selected));}}
        catch(Exception failure){NativeUi.text(root,"The offline guide could not be loaded.",14,false,NativeUi.AMBER);}
        LinearLayout caution=NativeUi.card(root);NativeUi.eyebrow(caution,"WATCH OUT FOR A SECOND SCAM");NativeUi.space(caution,10);NativeUi.text(caution,"Recovery is not guaranteed.",18,true,NativeUi.INK);NativeUi.space(caution,8);NativeUi.text(caution,"Be careful of anyone asking for an upfront fee to recover money or an account. Use your provider’s official support.",12,false,NativeUi.MUTED);NativeUi.footer(root);
    }
    private void showGuide(JSONObject item){
        LinearLayout body=NativeUi.vertical(this);body.setPadding(NativeUi.dp(this,23),NativeUi.dp(this,18),NativeUi.dp(this,23),NativeUi.dp(this,22));body.setBackground(new NativeUi.Backdrop());
        NativeUi.eyebrow(body,"YOUR NEXT SAFE STEPS");NativeUi.space(body,13);NativeUi.text(body,item.optString("title"),24,true,NativeUi.INK);NativeUi.space(body,12);NativeUi.text(body,item.optString("intro"),13,false,NativeUi.MUTED);
        JSONArray steps=item.optJSONArray("steps");if(steps!=null)for(int i=0;i<steps.length();i++){NativeUi.space(body,20);LinearLayout row=NativeUi.horizontal(this);row.setGravity(Gravity.TOP);TextView number=NativeUi.pill(this,String.format(Locale.ROOT,"%02d",i+1),NativeUi.LIME);row.addView(number);NativeUi.gap(row,12);row.addView(NativeUi.label(this,steps.optString(i),13,450,NativeUi.INK),new LinearLayout.LayoutParams(0,-2,1));body.addView(row);}
        ScrollView scroll=new ScrollView(this);scroll.addView(body);AlertDialog dialog=new AlertDialog.Builder(this).setView(scroll).setPositiveButton("Got it",null).create();dialog.show();if(dialog.getWindow()!=null){dialog.getWindow().setBackgroundDrawable(NativeUi.background(this,NativeUi.FOREST));dialog.getWindow().setLayout(-1,(int)(getResources().getDisplayMetrics().heightPixels*.84f));}dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(NativeUi.LIME);
    }

    private void settings(){
        LinearLayout root=screen("settings");NativeUi.eyebrow(root,"YOUR PERMISSIONS. YOUR CHOICE.");NativeUi.space(root,11);NativeUi.heading(root,"Make it yours.","Choose what SecondLook checks, and when it warns.");
        LinearLayout appearance=NativeUi.card(root);NativeUi.section(appearance,"Make it your space",null);
        String appearanceMode=prefs.getString("appearance","system");LinearLayout modes=NativeUi.horizontal(this);appearance.addView(modes);
        String[] modeValues={"light","dark","system"};String[] modeLabels={"Light","Dark","System"};
        for(int i=0;i<modeValues.length;i++){final String choice=modeValues[i];Button button=segment(modes,modeLabels[i],choice.equals(appearanceMode));button.setOnClickListener(view->{prefs.edit().putString("appearance",choice).apply();refreshAppearance();});}
        NativeUi.space(appearance,12);toggle(appearance,"Live background","Gentle colour and depth, only while the app is visible. Respects Android’s Remove animations setting.",prefs.getBoolean("motion",true),value->{prefs.edit().putBoolean("motion",value).apply();refreshAppearance();});
        LinearLayout state=NativeUi.card(root);toggle(state,"Notification checks","Paused by default. Turn on only when you’re ready.",prefs.getBoolean("enabled",false),value->{enabled(value);});
        NativeUi.space(root,6);NativeUi.section(root,"Connect the essentials","2 PERMISSIONS");
        permissionCard(root,"01","Warning notifications",canWarn()?"Allowed · Android settings can still silence alerts":"Allow private, local warning notifications",canWarn(),()->{
            if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},33);
            else openSettings(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));
        });
        permissionCard(root,"02","Notification access",hasAccess()?"Enabled for this preview installation":"Review this powerful permission before enabling",hasAccess(),this::requestAccess);
        NativeUi.space(root,10);NativeUi.section(root,"Your messaging apps","CHOOSE YOUR APPS");LinearLayout apps=NativeUi.card(root);NativeUi.text(apps,"Only selected apps are checked. Hidden, redacted, or missing notification text is not accessible.",12,false,NativeUi.MUTED);NativeUi.space(apps,11);
        for(Map.Entry<String,String> app:messagingApps().entrySet()){
            String key=app.getKey();toggle(apps,app.getValue(),null,selectedApps().contains(key),value->{Set<String> next=new HashSet<>(selectedApps());if(value)next.add(key);else next.remove(key);prefs.edit().putStringSet("apps",next).apply();});
        }
        NativeUi.space(root,8);NativeUi.section(root,"Keep it quiet",null);LinearLayout quiet=NativeUi.card(root);toggle(quiet,"Include caution-level results","Off: strong warning signs only. On: more warnings and more possible false alarms.",prefs.getBoolean("caution",false),value->prefs.edit().putBoolean("caution",value).apply());
        NativeUi.space(quiet,17);NativeUi.text(quiet,"Repeat-warning gap, per app",12,true,NativeUi.INK);NativeUi.space(quiet,12);LinearLayout periods=NativeUi.horizontal(this);quiet.addView(periods);long selected=prefs.getLong("cooldown",30000);Button[] choices=new Button[3];long[] values={15000,30000,60000};for(int i=0;i<3;i++){final int position=i;choices[i]=segment(periods,new String[]{"15 sec","30 sec","60 sec"}[i],selected==values[i]);choices[i].setOnClickListener(view->{prefs.edit().putLong("cooldown",values[position]).apply();for(int j=0;j<3;j++)setSegment(choices[j],j==position);});}
        NativeUi.space(quiet,13);NativeUi.text(quiet,"Duplicates are suppressed in memory. Work runs on notification events—not a polling loop. Battery use has not been measured on your phone.",11,false,NativeUi.MUTED);
        NativeUi.action(root,"refresh","Refresh the connection","Ask Android to reconnect, without background retries.",()->{if(hasAccess())reconnect();else toast("Enable notification access first.");settings();});
        NativeUi.action(root,"info","Privacy & honest limits","Know what this preview can—and cannot—do.",this::privacy);
        NativeUi.text(root,"v1.3 Prism preview · A separate preview installation. If the earlier app is still enabled, pause it to avoid duplicate warnings.",10,false,NativeUi.MUTED);NativeUi.footer(root);
    }
    private interface ToggleAction{void set(boolean value);}
    private void toggle(LinearLayout root,String title,String subtitle,boolean checked,ToggleAction action){
        LinearLayout row=NativeUi.horizontal(this);row.setPadding(0,NativeUi.dp(this,12),0,NativeUi.dp(this,12));LinearLayout words=NativeUi.vertical(this);NativeUi.text(words,title,13,true,NativeUi.INK);if(subtitle!=null){NativeUi.space(words,5);NativeUi.text(words,subtitle,11,false,NativeUi.MUTED);}row.addView(words,new LinearLayout.LayoutParams(0,-2,1));NativeUi.gap(row,14);
        Switch control=new Switch(this);control.setContentDescription(title);control.setChecked(checked);control.setThumbTintList(new android.content.res.ColorStateList(new int[][]{new int[]{android.R.attr.state_checked},new int[]{}},new int[]{NativeUi.LIME,NativeUi.MUTED}));control.setTrackTintList(new android.content.res.ColorStateList(new int[][]{new int[]{android.R.attr.state_checked},new int[]{}},new int[]{NativeUi.ACCENT_SURFACE,NativeUi.BORDER}));control.setShowText(false);row.addView(control);root.addView(row);control.setOnCheckedChangeListener((button,value)->action.set(value));
    }
    private void permissionCard(LinearLayout root,String number,String title,String explanation,boolean allowed,Runnable action){
        LinearLayout card=NativeUi.card(root);LinearLayout row=NativeUi.horizontal(this);row.addView(NativeUi.pill(this,allowed?"✓":number,allowed?NativeUi.LIME:NativeUi.AMBER));NativeUi.gap(row,12);LinearLayout copy=NativeUi.vertical(this);NativeUi.text(copy,title,14,true,NativeUi.INK);NativeUi.space(copy,5);NativeUi.text(copy,explanation,11,false,NativeUi.MUTED);row.addView(copy,new LinearLayout.LayoutParams(0,-2,1));card.addView(row);NativeUi.button(card,allowed?"Review settings   →":"Review and connect   →",action,!allowed);
    }
    private void requestAccess(){
        new AlertDialog.Builder(this).setTitle("Your messages deserve privacy").setMessage("Notification access is a powerful Android permission. This preview reads available notification text only from apps you select. It does not read private chat databases, SMS storage, or contacts. It has no Internet permission.\n\nAndroid can redact sensitive notifications and restrict sideloaded apps. SecondLook respects those controls. Do not disable Play Protect or OTP protections.\n\nYou can revoke access completely in Android settings.").setNegativeButton("Not now",null).setPositiveButton("Open Android settings",(dialog,which)->openSettings(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))).show();
    }
    private void privacy(){info("Local by design. Not all-seeing.","No Internet permission, message uploads, accounts, or saved scan history. Only app selections and controls are saved locally. Check screens are excluded from screenshots where Android supports FLAG_SECURE.\n\nThis build is a non-debuggable preview, not a store-reviewed production release. It can miss scams and flag legitimate content. Hidden previews, OS restrictions, busy queues, and warning cooldowns can limit coverage. It cannot intercept every link in other apps.\n\nYour device, OS, other apps, hosting account, and signing-key management are outside the rule engine’s protection. No software is unhackable.");}
    private void info(String title,String body){new AlertDialog.Builder(this).setTitle(title).setMessage(body).setPositiveButton("Understood",null).show();}
    private LinkedHashMap<String,String> messagingApps(){
        LinkedHashMap<String,String> apps=new LinkedHashMap<>();String sms=Telephony.Sms.getDefaultSmsPackage(this);if(sms!=null)apps.put(sms,"Default SMS app");apps.put("com.whatsapp","WhatsApp");apps.put("com.whatsapp.w4b","WhatsApp Business");apps.put("com.facebook.orca","Messenger");apps.put("org.telegram.messenger","Telegram");apps.put("org.telegram.messenger.web","Telegram direct edition");apps.put("com.instagram.android","Instagram");apps.put("com.facebook.katana","Facebook notifications");apps.putIfAbsent("com.google.android.apps.messaging","Google Messages");apps.putIfAbsent("com.samsung.android.messaging","Samsung Messages");apps.putIfAbsent("com.android.mms","System Messaging");return apps;
    }
}
