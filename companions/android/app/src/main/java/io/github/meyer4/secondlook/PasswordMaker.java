package io.github.meyer4.secondlook;
import java.security.SecureRandom;

public final class PasswordMaker {
    private static final SecureRandom RANDOM=new SecureRandom();
    private static final String[] GROUPS={"abcdefghijkmnpqrstuvwxyz","ABCDEFGHJKLMNPQRSTUVWXYZ","23456789","!@#$%^&*()-_=+[]{}:;,.?"};
    public static String generate(int length) {
        if(length<12||length>40)throw new IllegalArgumentException("Choose 12 to 40 characters.");
        String alphabet=String.join("",GROUPS);
        for(int attempt=0;attempt<1000;attempt++) {
            StringBuilder value=new StringBuilder();for(int i=0;i<length;i++)value.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
            String password=value.toString();boolean valid=true;
            for(String group:GROUPS){boolean found=false;for(char character:password.toCharArray())if(group.indexOf(character)>=0)found=true;if(!found)valid=false;}
            if(valid)return password;
        }
        throw new IllegalStateException("Secure generation failed. Try again.");
    }
}
