package io.github.meyer4.secondlook;
import android.content.Context;
import android.graphics.*;

/** Animated aurora: three bounded radial gradients and a sparse constellation. */
final class PrismBackdropView extends PrismMotionView {
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    private Shader violet,cyan,rose;
    PrismBackdropView(Context context){super(context);}
    @Override protected void onSizeChanged(int w,int h,int oldW,int oldH){super.onSizeChanged(w,h,oldW,oldH);float radius=Math.max(1,w*.95f);violet=glow(radius,NativeUi.DARK?0x386F61DE:0x507C8CF4);cyan=glow(radius,NativeUi.DARK?0x3025B9D6:0x4265DAED);rose=glow(radius,NativeUi.DARK?0x30DD78B0:0x40F1A7C6);}
    private Shader glow(float radius,int color){return new RadialGradient(0,0,radius,new int[]{color,color&0x00ffffff},null,Shader.TileMode.CLAMP);}
    private void cloud(Canvas canvas,Shader shader,float x,float y){canvas.save();canvas.translate(x,y);paint.setShader(shader);canvas.drawRect(-getWidth()*2,-getHeight()*2,getWidth()*2,getHeight()*2,paint);canvas.restore();paint.setShader(null);}
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);canvas.drawColor(NativeUi.PAPER);
        cloud(canvas,violet,getWidth()*(.12f+(float)Math.sin(phase*.14)*.08f),getHeight()*.10f);
        cloud(canvas,cyan,getWidth()*.95f,getHeight()*(.38f+(float)Math.cos(phase*.10)*.1f));
        cloud(canvas,rose,getWidth()*.32f,getHeight()*.94f);
        paint.setColor(NativeUi.DARK?0x368EA9E3:0x336077BB);paint.setStrokeWidth(1);
        for(int i=0;i<16;i++){float x=((i*.6180339f)%1)*getWidth();float y=((i*.4142f+.13f)%1)*getHeight();canvas.drawCircle(x,y,i%4==0?2:1,paint);if(i%4==0){paint.setAlpha(30);canvas.drawLine(x,y,x+30,y-20,paint);canvas.drawLine(x+30,y-20,x+60,y,paint);paint.setAlpha(54);}}
    }
}
