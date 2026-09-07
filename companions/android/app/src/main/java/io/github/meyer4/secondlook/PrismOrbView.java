package io.github.meyer4.secondlook;
import android.content.Context;
import android.graphics.*;

/** A dimensional lens token and tilted orbits; foreground-only, low-rate motion. */
final class PrismOrbView extends PrismMotionView {
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    PrismOrbView(Context context){super(context);}
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);canvas.save();canvas.scale(getWidth()/110f,getHeight()/140f);
        float turn=(float)Math.sin(phase*.35)*5;
        paint.setStyle(Paint.Style.FILL);paint.setShader(new RadialGradient(56,65,52,new int[]{NativeUi.DARK?0x557F71F7:0x448F85F0,0x00908AEA},null,Shader.TileMode.CLAMP));canvas.drawCircle(56,65,52,paint);paint.setShader(null);
        canvas.save();canvas.rotate(-25+turn,56,66);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.2f);paint.setColor(NativeUi.DARK?0x8881D1E5:0x88809ECE);canvas.drawOval(4,39,107,91,paint);canvas.restore();
        paint.setStyle(Paint.Style.FILL);paint.setColor(NativeUi.DARK?0x55000821:0x22465B9E);canvas.drawOval(27,102,91,117,paint);
        canvas.save();canvas.rotate(9+turn*.35f,56,65);
        paint.setShader(new LinearGradient(26,31,88,96,new int[]{0xFF8D92D8,0xFF5EA6CF},null,Shader.TileMode.CLAMP));canvas.drawRoundRect(31,33,90,101,19,19,paint);paint.setShader(null);
        paint.setShader(new LinearGradient(25,27,90,92,new int[]{0xFFF4EFFF,0xFFC6C5F3,0xFF9EDAE9,0xFFE6C6E6},null,Shader.TileMode.CLAMP));canvas.drawRoundRect(23,26,84,94,19,19,paint);paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.1f);paint.setColor(0xCCFFFFFF);canvas.drawRoundRect(23,26,84,94,19,19,paint);paint.setColor(0x75FFFFFF);canvas.drawRoundRect(27,30,80,90,16,16,paint);
        paint.setColor(0xFF354B84);paint.setStrokeWidth(2);Path eye=new Path();eye.moveTo(32,60);eye.cubicTo(44,40,63,40,75,60);eye.cubicTo(63,80,44,80,32,60);canvas.drawPath(eye,paint);paint.setStyle(Paint.Style.FILL);canvas.drawCircle(54,60,7,paint);paint.setColor(0xFFF2F8FF);canvas.drawCircle(56,58,2.1f,paint);canvas.restore();
        canvas.save();canvas.rotate(-25+turn,56,66);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.2f);paint.setColor(NativeUi.DARK?0xFFC8A1E0:0xFFAD70BB);canvas.drawArc(4,39,107,91,0,147,false,paint);canvas.restore();
        paint.setStrokeWidth(1.1f);paint.setColor(NativeUi.CYAN);canvas.drawLine(90,19,90,27,paint);canvas.drawLine(86,23,94,23,paint);paint.setColor(NativeUi.ROSE);canvas.drawLine(20,108,20,116,paint);canvas.drawLine(16,112,24,112,paint);canvas.restore();
    }
}
