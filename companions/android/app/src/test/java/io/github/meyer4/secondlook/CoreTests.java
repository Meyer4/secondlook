package io.github.meyer4.secondlook;
import org.junit.Test;
import static org.junit.Assert.*;
import org.json.*;
import java.nio.charset.StandardCharsets;
import java.io.*;

public class CoreTests {
    private String resource(String name) throws Exception {try(InputStream input=getClass().getClassLoader().getResourceAsStream(name)){assertNotNull(input);return new String(input.readAllBytes(),StandardCharsets.UTF_8);}}
    @Test public void sharedVectorsAgree() throws Exception {
        SafetyEngine engine=new SafetyEngine(resource("rules.json"));JSONArray cases=new JSONArray(resource("vectors.json"));assertEquals(30,cases.length());
        for(int i=0;i<cases.length();i++){JSONObject vector=cases.getJSONObject(i);SafetyEngine.Result result=vector.getString("kind").equals("message")?engine.checkMessage(vector.getString("input")):engine.checkLink(vector.getString("input"));assertEquals(vector.getString("id")+": "+vector.getString("input"),vector.getString("level"),result.level());}
    }
    @Test public void validationBounds() throws Exception {
        SafetyEngine engine=new SafetyEngine(resource("rules.json"));assertThrows(IllegalArgumentException.class,()->engine.checkMessage(""));assertThrows(IllegalArgumentException.class,()->engine.checkMessage("a".repeat(12001)));assertThrows(IllegalArgumentException.class,()->engine.checkLink("a".repeat(4097)));
    }
    @Test public void actualUserInfoDestination() throws Exception {assertEquals("wrong.example",new SafetyEngine(resource("rules.json")).checkLink("https://paypal.com@wrong.example/path").hostname);}
    @Test public void noSafeVerdict() throws Exception {SafetyEngine.Result result=new SafetyEngine(resource("rules.json")).checkLink("https://example.com");assertEquals("unknown",result.level());assertTrue(result.explanation().contains("does not mean"));}
    @Test public void duplicatesSuppressedAndExpire(){NotificationPolicy policy=new NotificationPolicy();assertTrue(policy.accept("app","key","body",100));assertFalse(policy.accept("app","key","body",101));assertTrue(policy.accept("app","key","new body",102));assertTrue(policy.accept("app","key","body",700000));}
    @Test public void hashCacheIsBounded(){NotificationPolicy policy=new NotificationPolicy();for(int i=0;i<1000;i++)policy.accept("app","key"+i,"text",i);assertTrue(policy.retainedDigests()<=128);}
    @Test public void warningCooldownIsPerApp(){NotificationPolicy policy=new NotificationPolicy();assertTrue(policy.mayWarn("one",0,30000));assertFalse(policy.mayWarn("one",29999,30000));assertTrue(policy.mayWarn("two",1,30000));assertTrue(policy.mayWarn("one",30000,30000));}
    @Test public void severityControl() throws Exception {SafetyEngine engine=new SafetyEngine(resource("rules.json"));SafetyEngine.Result result=engine.checkMessage("Please reply immediately.");assertFalse(NotificationPolicy.shouldWarn(result,false));assertTrue(NotificationPolicy.shouldWarn(result,true));assertTrue(NotificationPolicy.shouldWarn(engine.checkMessage("Send your OTP."),false));}
    @Test public void passwordRandomnessAndLength(){for(int length:new int[]{12,16,20,32,40}){String password=PasswordMaker.generate(length);assertEquals(length,password.length());assertTrue(password.matches(".*[a-z].*"));assertTrue(password.matches(".*[A-Z].*"));assertTrue(password.matches(".*[2-9].*"));}assertNotEquals(PasswordMaker.generate(20),PasswordMaker.generate(20));assertThrows(IllegalArgumentException.class,()->PasswordMaker.generate(4));}
    @Test public void extractedBracketsStayBalanced(){assertEquals("https://[::1]",SafetyEngine.extractLinks("Check https://[::1]").get(0));assertEquals("https://example.com/wiki/Test_(example)",SafetyEngine.extractLinks("See https://example.com/wiki/Test_(example).").get(0));}
}
