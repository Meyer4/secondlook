package io.github.meyer4.secondlook;

/** Defensive boundaries for framework-provided notification/share text. */
final class SafeText {
    static String bounded(CharSequence value,int maximum) {
        if(value==null||maximum<=0)return "";
        try {
            int length=Math.min(Math.max(0,value.length()),maximum);
            StringBuilder copy=new StringBuilder(length);
            // Do not call an unbounded toString() before applying the size limit.
            for(int i=0;i<length;i++)copy.append(value.charAt(i));
            if(copy.length()>0&&Character.isHighSurrogate(copy.charAt(copy.length()-1)))copy.setLength(copy.length()-1);
            return copy.toString();
        } catch(RuntimeException malformed) { return ""; }
    }
    static String joinBounded(Iterable<String> values,int maximum) {
        StringBuilder output=new StringBuilder();
        for(String value:values) {
            if(value==null||value.isEmpty())continue;
            int remaining=maximum-output.length();
            if(remaining<=0)break;
            if(output.length()>0) { if(remaining<=1)break;output.append('\n');remaining--; }
            output.append(bounded(value,remaining));
        }
        return output.toString();
    }
}
