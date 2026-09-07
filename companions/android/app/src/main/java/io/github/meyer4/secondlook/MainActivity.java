package io.github.meyer4.secondlook;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.provider.Settings;
import android.provider.Telephony;
import android.service.notification.NotificationListenerService;
import android.text.InputFilter;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.util.*;

public final class MainActivity extends Activity {
    private String currentPage="protection";
    private android.content.SharedPreferences prefs;
    private EditText checkInput;
    private LinearLayout resultArea;
    @Override public void onCreate(Bundle state){super.onCreate(state);prefs=SecondLookApp.prefs(this);handleIntent(getIntent());}
    @Override public void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);handleIntent(intent);}
    @Override public void onResume(){super.onResume();if(prefs!=null&&currentPage.equals("protection"))protection();}
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(currentPage.equals("protection"))protection();}
    private void handleIntent(Intent intent){
        CharSequence shared=null;
        if(Intent.ACTION_SEND.equals(intent.getAction()))shared=intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        else if(Intent.ACTION_PROCESS_TEXT.equals(intent.getAction()))shared=intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
        if(shared!=null){manualCheck(shared.toString().substring(0,Math.min(shared.length(),SafetyEngine.MAX_TEXT)));if(shared.length()>SafetyEngine.MAX_TEXT)Toast.makeText(this,"Only the first 12,000 characters of the share are shown. Check the rest separately.",Toast.LENGTH_LONG).show();return;}
        if("playbook".equals(intent.getStringExtra("page")))playbook();else protection();
    }
    private void navigation(LinearLayout root){
        LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.HORIZONTAL);root.addView(row);
        String[] labels={"Protection","Check","Passwords","Playbook"};Runnable[] actions={this::protection,()->manualCheck(""),this::passwords,this::playbook};
        for(int i=0;i<labels.length;i++){Button button=new Button(this);button.setText(labels[i]);button.setAllCaps(false);button.setTextSize(11);button.setMinWidth(0);button.setMinimumWidth(0);button.setPadding(2,0,2,0);button.setTextColor(NativeUi.INK);button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(NativeUi.LIME));row.addView(button,new LinearLayout.LayoutParams(0,NativeUi.dp(this,48),1));final Runnable action=actions[i];button.setOnClickListener(view->action.run());}
        NativeUi.space(root,20);
    }
    private boolean hasAccess(){
        ComponentName name=new ComponentName(this,SecondLookListener.class);
        if(Build.VERSION.SDK_INT>=27)return getSystemService(NotificationManager.class).isNotificationListenerAccessGranted(name);
        String enabled=Settings.Secure.getString(getContentResolver(),"enabled_notification_listeners");return enabled!=null&&Arrays.asList(enabled.split(":")).contains(name.flattenToString());
    }
    private boolean canWarn(){
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return false;
        NotificationManager manager=getSystemService(NotificationManager.class);NotificationChannel channel=manager.getNotificationChannel(SecondLookApp.CHANNEL);
        return manager.areNotificationsEnabled()&&(channel==null||channel.getImportance()!=NotificationManager.IMPORTANCE_NONE);
    }
    private LinkedHashMap<String,String> messagingApps(){
        LinkedHashMap<String,String> apps=new LinkedHashMap<>();
        String sms=Telephony.Sms.getDefaultSmsPackage(this);if(sms!=null)apps.put(sms,"Your default SMS app");
        apps.put("com.whatsapp","WhatsApp");apps.put("com.whatsapp.w4b","WhatsApp Business");apps.put("com.facebook.orca","Messenger");apps.put("org.telegram.messenger","Telegram");apps.put("org.telegram.messenger.web","Telegram direct-download edition");apps.put("com.instagram.android","Instagram");apps.put("com.facebook.katana","Facebook (notification text only)");
        apps.putIfAbsent("com.google.android.apps.messaging","Google Messages / SMS");apps.putIfAbsent("com.samsung.android.messaging","Samsung Messages / SMS");apps.putIfAbsent("com.android.mms","System Messaging / SMS");return apps;
    }
    private void protection(){
        currentPage="protection";
        LinearLayout root=NativeUi.page(this,"Android companion · preview","A little pause.\nA safer next step.");navigation(root);
        boolean selected=!prefs.getStringSet("apps",Collections.emptySet()).isEmpty();boolean enabled=prefs.getBoolean("enabled",false);boolean access=hasAccess();boolean alerts=canWarn();
        String status=!enabled?"PROTECTION IS PAUSED":!selected?"CHOOSE AT LEAST ONE APP":!access?"NOTIFICATION ACCESS REQUIRED":!alerts?"WARNING NOTIFICATIONS ARE BLOCKED":!SecondLookListener.connected?"WAITING FOR ANDROID TO CONNECT":"CONNECTED TO ANDROID NOTIFICATIONS";
        LinearLayout state=NativeUi.card(root);NativeUi.text(state,status,12,true,NativeUi.MUTED);NativeUi.space(state,11);NativeUi.text(state,"Only notification text from apps you select is checked. Hidden, redacted, muted, or missing previews cannot be inspected. We never open the original message or follow its links.",14,false,NativeUi.MUTED);
        Switch master=new Switch(this);master.setText("Enable local notification checks");master.setTextSize(14);master.setPadding(0,NativeUi.dp(this,15),0,0);master.setChecked(enabled);state.addView(master);master.setOnCheckedChangeListener((button,value)->{prefs.edit().putBoolean("enabled",value).apply();if(value&&hasAccess())NotificationListenerService.requestRebind(new ComponentName(this,SecondLookListener.class));protection();});
        NativeUi.button(state,"Re-check connection",()->{if(hasAccess())NotificationListenerService.requestRebind(new ComponentName(this,SecondLookListener.class));protection();},false);
        LinearLayout setup=NativeUi.card(root);NativeUi.text(setup,"Your permissions, your choice",18,true,NativeUi.INK);
        NativeUi.button(setup,alerts?"Warning notifications: allowed · settings":"1. Allow warning notifications",()->{
            if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},33);
            else startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));
        },!alerts);
        NativeUi.button(setup,access?"Notification access: enabled · settings":"2. Review notification access",()->new AlertDialog.Builder(this).setTitle("Review before enabling")
            .setMessage("Android notification access is a powerful permission. SecondLook reads available notification text only from apps you select below. It does not read private chat databases, contact lists, or SMS storage. It does not request Internet access or try to bypass redaction.\n\nTo revoke access completely, turn it off in Android settings. Do not disable Android’s OTP protections or Play Protect.")
            .setNegativeButton("Not now",null).setPositiveButton("Open Android settings",(dialog,which)->startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))).show(),!access);
        NativeUi.text(setup,"Android may restrict notification access for sideloaded apps or work profiles. Do Not Disturb, disabled channels, and manufacturer power settings can suppress or delay warnings.",12,false,NativeUi.MUTED);
        LinearLayout appsCard=NativeUi.card(root);NativeUi.text(appsCard,"3. Select apps to check",18,true,NativeUi.INK);NativeUi.text(appsCard,"None are selected on a fresh install. This is an allowlist—not access to private conversations. Unsupported variants can still use Share → SecondLook.",12,false,NativeUi.MUTED);
        Set<String> allowed=prefs.getStringSet("apps",Collections.emptySet());
        for(Map.Entry<String,String> app:messagingApps().entrySet()){
            CheckBox box=new CheckBox(this);box.setText(app.getValue());box.setTextSize(14);box.setTextColor(NativeUi.INK);box.setChecked(allowed.contains(app.getKey()));appsCard.addView(box);
            box.setOnCheckedChangeListener((button,value)->{Set<String> next=new HashSet<>(prefs.getStringSet("apps",Collections.emptySet()));if(value)next.add(app.getKey());else next.remove(app.getKey());prefs.edit().putStringSet("apps",next).apply();});
        }
        NativeUi.button(appsCard,"Apply choices and refresh status",this::protection,true);
        LinearLayout settings=NativeUi.card(root);NativeUi.text(settings,"Quiet by default",18,true,NativeUi.INK);
        Switch caution=new Switch(this);caution.setText("Also warn for caution-level results");caution.setTextSize(13);caution.setChecked(prefs.getBoolean("caution",false));settings.addView(caution);caution.setOnCheckedChangeListener((button,value)->prefs.edit().putBoolean("caution",value).apply());
        NativeUi.text(settings,"Off means strong-warning results only. Turning this on may create more false alarms. Duplicate notification text is suppressed in memory.",12,false,NativeUi.MUTED);NativeUi.space(settings,12);NativeUi.text(settings,"Minimum gap between warnings from one app",12,true,NativeUi.INK);
        Spinner cooldown=new Spinner(this);ArrayAdapter<String> adapter=new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"15 seconds","30 seconds · recommended","60 seconds"});cooldown.setAdapter(adapter);long saved=prefs.getLong("cooldown",30000L);cooldown.setSelection(saved==15000?0:saved==60000?2:1);settings.addView(cooldown);cooldown.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener(){public void onNothingSelected(AdapterView<?> parent){}public void onItemSelected(AdapterView<?> parent,View view,int position,long id){prefs.edit().putLong("cooldown",new long[]{15000,30000,60000}[position]).apply();}});
        NativeUi.space(settings,10);NativeUi.text(settings,"Only notification events trigger work. The queue and memory cache are bounded; the worker thread sleeps when idle. No polling, wake lock, accessibility scraping, or remote AI. Battery use is not yet measured on physical phones.",12,false,NativeUi.MUTED);
        NativeUi.text(root,"English-first pattern checks. Never a guarantee of safety. Android can stop or restrict the listener, and bursts or cooldowns can cause messages to be missed. This app cannot intercept every link inside other apps.",12,false,NativeUi.MUTED);
        NativeUi.button(root,"Privacy and limitations",()->new AlertDialog.Builder(this).setTitle("Local by design")
            .setMessage("No INTERNET permission. No message history, accounts, analytics, or uploads. App selections and warning settings stay in Android app preferences; cloud backup is disabled. Short-lived hashes are kept only in memory to suppress duplicates. Warning cards contain generic rule titles, not original messages.\n\nCopied passwords can remain in OS clipboard history. Native and browser URL parsers can differ. These rules can miss scams and flag legitimate content.\n\nAndroid 15 and later can redact sensitive notifications. SecondLook respects that protection. It cannot read messages that apps or Android do not expose.").setPositiveButton("Understood",null).show(),false);
    }
    private void manualCheck(String initial){
        currentPage="check";LinearLayout root=NativeUi.page(this,"Share or paste · offline","Take a second look.");navigation(root);
        LinearLayout card=NativeUi.card(root);NativeUi.text(card,"Remove passwords, PINs, security codes, and private access links first. Your input is not saved or uploaded.",13,false,NativeUi.MUTED);
        checkInput=new EditText(this);checkInput.setHint("Paste a message or link…");checkInput.setText(initial);checkInput.setTextSize(16);checkInput.setMinLines(4);checkInput.setGravity(Gravity.TOP);checkInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(SafetyEngine.MAX_TEXT)});checkInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE|android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);checkInput.setSaveEnabled(false);checkInput.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);card.addView(checkInput,new LinearLayout.LayoutParams(-1,-2));
        NativeUi.button(card,"Paste from clipboard",()->{ClipboardManager clipboard=getSystemService(ClipboardManager.class);ClipData clip=clipboard.getPrimaryClip();if(clip!=null&&clip.getItemCount()>0&&clip.getItemAt(0).getText()!=null)checkInput.setText(clip.getItemAt(0).getText());else Toast.makeText(this,"No text available to paste.",Toast.LENGTH_SHORT).show();},false);
        NativeUi.button(card,"Check as a message",()->analyse(false),true);NativeUi.button(card,"Inspect as a link",()->analyse(true),false);NativeUi.button(card,"Clear input and result",()->{checkInput.setText("");resultArea.removeAllViews();},false);
        resultArea=new LinearLayout(this);resultArea.setOrientation(LinearLayout.VERTICAL);root.addView(resultArea);
        checkInput.addTextChangedListener(new android.text.TextWatcher(){public void beforeTextChanged(CharSequence s,int start,int count,int after){}public void onTextChanged(CharSequence s,int start,int before,int count){if(resultArea!=null)resultArea.removeAllViews();}public void afterTextChanged(android.text.Editable s){}});
        if(!initial.isEmpty())analyse(false);
    }
    private void analyse(boolean link){
        resultArea.removeAllViews();LinearLayout card=NativeUi.card(resultArea);
        try {
            SafetyEngine engine=((SecondLookApp)getApplication()).engine();SafetyEngine.Result result=link?engine.checkLink(checkInput.getText().toString()):engine.checkMessage(checkInput.getText().toString());
            NativeUi.text(card,result.label(),20,true,NativeUi.INK);NativeUi.space(card,10);NativeUi.text(card,result.explanation(),14,false,NativeUi.MUTED);
            if(!result.hostname.isEmpty()){NativeUi.space(card,13);NativeUi.text(card,"Parsed hostname (not a clickable link)",11,true,NativeUi.MUTED);NativeUi.text(card,result.hostname,16,true,NativeUi.INK);if(result.assumedHttps)NativeUi.text(card,"HTTPS was assumed for parsing, not tested.",12,false,NativeUi.MUTED);}
            for(SafetyEngine.Signal signal:result.signals){NativeUi.space(card,15);NativeUi.text(card,signal.title,15,true,NativeUi.INK);NativeUi.text(card,signal.detail,13,false,NativeUi.MUTED);}
            NativeUi.space(card,18);NativeUi.text(card,"Next safe step",16,true,NativeUi.INK);NativeUi.text(card,SafetyEngine.nextStep(result),14,false,NativeUi.MUTED);NativeUi.space(card,13);NativeUi.text(card,"English-language patterns; no live threat database, website visit, redirect following, or file scan. Native and browser parsers can differ.",12,false,NativeUi.MUTED);
        }catch(Exception error){NativeUi.text(card,error.getMessage()==null?"This input could not be checked.":error.getMessage(),14,false,NativeUi.INK);}
    }
    private void passwords(){
        currentPage="passwords";LinearLayout root=NativeUi.page(this,"One password. One account.","Less guesswork.");navigation(root);LinearLayout card=NativeUi.card(root);
        NativeUi.text(card,"Generate a long, unique password. Save it in a password manager, not your notes. Nothing is saved by SecondLook.",14,false,NativeUi.MUTED);NativeUi.space(card,16);
        TextView output=NativeUi.text(card,PasswordMaker.generate(20),22,true,NativeUi.INK);output.setTextIsSelectable(true);output.setSaveEnabled(false);
        Spinner size=new Spinner(this);ArrayAdapter<String> adapter=new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"16 characters","20 characters","24 characters","32 characters","40 characters"});size.setAdapter(adapter);size.setSelection(1);card.addView(size);
        NativeUi.button(card,"Generate another",()->{try{output.setText(PasswordMaker.generate(new int[]{16,20,24,32,40}[size.getSelectedItemPosition()]));}catch(Exception error){output.setText("Secure generation failed.");}},true);
        NativeUi.button(card,"Copy password",()->{ClipData clip=ClipData.newPlainText("Generated password",output.getText());android.os.PersistableBundle extras=new android.os.PersistableBundle();extras.putBoolean("android.content.extra.IS_SENSITIVE",true);clip.getDescription().setExtras(extras);getSystemService(ClipboardManager.class).setPrimaryClip(clip);Toast.makeText(this,"Copied. Be mindful of clipboard history.",Toast.LENGTH_LONG).show();},false);
        NativeUi.space(card,15);NativeUi.text(card,"Uses the operating system’s cryptographic random generator. Similar-looking letters and digits are avoided. No password history. Clipboard contents are managed by your operating system and other apps may access them.",12,false,NativeUi.MUTED);
    }
    private void playbook(){
        currentPage="playbook";LinearLayout root=NativeUi.page(this,"Practical steps. No blame.","Start with the next safe step.");navigation(root);
        try {JSONArray guides=((SecondLookApp)getApplication()).engine().playbook;for(int i=0;i<guides.length();i++){
            JSONObject guide=guides.getJSONObject(i);LinearLayout card=NativeUi.card(root);NativeUi.text(card,guide.getString("label"),19,true,NativeUi.INK);NativeUi.space(card,9);NativeUi.text(card,guide.getString("intro"),13,false,NativeUi.MUTED);
            JSONArray steps=guide.getJSONArray("steps");for(int j=0;j<steps.length();j++){NativeUi.space(card,12);NativeUi.text(card,(j+1)+". "+steps.getString(j),14,false,NativeUi.MUTED);}
        }}catch(Exception error){NativeUi.text(root,"The offline playbook could not be loaded.",14,false,NativeUi.MUTED);}
        NativeUi.text(root,"Beware of anyone promising to recover lost funds for an upfront fee. Contact providers through official channels. Recovery is not guaranteed.",13,true,NativeUi.MUTED);
    }
}
