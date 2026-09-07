package io.github.meyer4.secondlook;
import android.content.Context;
import android.graphics.*;
import android.view.View;

/** Original vector-like icons, drawn once per invalidation, with no timer. */
final class IconView extends View {
    private final String name; private final int color; private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    IconView(Context context,String name,int color){super(context);this.name=name;this.color=color;setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);}
    @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);canvas.save();float size=Math.min(getWidth(),getHeight());canvas.translate((getWidth()-size)/2,(getHeight()-size)/2);canvas.scale(size/24,size/24);paint.setColor(color);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.6f);paint.setStrokeCap(Paint.Cap.ROUND);paint.setStrokeJoin(Paint.Join.ROUND);
        switch(name){
            case "home": path(canvas,3,10,12,3,21,10,21,21,15,21,15,14,9,14,9,21,3,21,3,10);break;
            case "eye": case "scan": pathCurveEye(canvas);if(name.equals("scan")){path(canvas,3,6,3,3,6,3);path(canvas,18,3,21,3,21,6);path(canvas,21,18,21,21,18,21);path(canvas,6,21,3,21,3,18);}break;
            case "key": canvas.drawCircle(8,8,5,paint);path(canvas,11.5f,11.5f,21,21);path(canvas,15,15,18,12);path(canvas,18,18,21,15);break;
            case "book": path(canvas,12,5,12,21);path(canvas,3,4,7,4,12,6,17,4,21,4,21,20,17,20,12,22,7,20,3,20,3,4);break;
            case "settings": canvas.drawCircle(12,12,4,paint);for(int i=0;i<8;i++){double a=i*Math.PI/4;canvas.drawLine(12+(float)Math.cos(a)*8,12+(float)Math.sin(a)*8,12+(float)Math.cos(a)*10,12+(float)Math.sin(a)*10,paint);}canvas.drawCircle(12,12,8,paint);break;
            case "message": canvas.drawRoundRect(3,3,21,18,4,4,paint);path(canvas,8,18,4,22,4,17);path(canvas,7,8,17,8);path(canvas,7,12,14,12);break;
            case "link": canvas.save();canvas.rotate(-40,12,12);canvas.drawRoundRect(3,8,13,16,4,4,paint);canvas.drawRoundRect(11,8,21,16,4,4,paint);path(canvas,9,12,15,12);canvas.restore();break;
            case "shield": path(canvas,12,2,21,6,20,14,17,19,12,22,7,19,4,14,3,6,12,2);path(canvas,8,12,11,15,16,9);break;
            case "lock": canvas.drawRoundRect(5,10,19,21,2,2,paint);canvas.drawArc(8,3,16,17,180,180,false,paint);path(canvas,12,14,12,17);break;
            case "phone": canvas.drawRoundRect(6,2,18,22,3,3,paint);path(canvas,10,5,14,5);path(canvas,11,19,13,19);break;
            case "help": canvas.drawCircle(12,12,9,paint);canvas.drawCircle(12,12,4,paint);path(canvas,5.5f,5.5f,9,9);path(canvas,15,15,18.5f,18.5f);path(canvas,5.5f,18.5f,9,15);path(canvas,15,9,18.5f,5.5f);break;
            case "arrow": path(canvas,5,12,19,12);path(canvas,13,6,19,12,13,18);break;
            case "check": path(canvas,5,12,9,16,19,6);break;
            case "copy": canvas.drawRoundRect(8,8,21,21,2,2,paint);path(canvas,16,8,16,3,3,3,3,16,8,16);break;
            case "refresh": canvas.drawArc(4,4,20,20,35,295,false,paint);path(canvas,21,3,21,9,15,9);break;
            case "alert": path(canvas,12,3,22,21,2,21,12,3);path(canvas,12,9,12,14);path(canvas,12,17,12,17.2f);break;
            case "wallet": canvas.drawRoundRect(3,6,21,21,2,2,paint);path(canvas,4,6,17,3,17,6);path(canvas,21,12,16,12,16,16,21,16);break;
            case "mouse": path(canvas,4,3,11,21,14,14,21,11,4,3);break;
            case "download": path(canvas,12,3,12,15);path(canvas,7,10,12,15,17,10);path(canvas,4,16,4,21,20,21,20,16);break;
            case "user": canvas.drawCircle(12,7,4,paint);canvas.drawArc(4,13,20,29,180,180,false,paint);break;
            case "sun": canvas.drawCircle(12,12,4,paint);for(int i=0;i<8;i++){double a=i*Math.PI/4;canvas.drawLine(12+(float)Math.cos(a)*7,12+(float)Math.sin(a)*7,12+(float)Math.cos(a)*10,12+(float)Math.sin(a)*10,paint);}break;
            case "moon": Path moon=new Path();moon.moveTo(18,16);moon.cubicTo(8,19,5,9,10,3);moon.cubicTo(0,5,2,22,13,21);moon.cubicTo(17,21,20,19,21,15);moon.lineTo(18,16);canvas.drawPath(moon,paint);break;
            case "pause": path(canvas,8,5,8,19);path(canvas,16,5,16,19);break;
            case "info": canvas.drawCircle(12,12,9,paint);path(canvas,12,11,12,17);path(canvas,12,7,12,7.2f);break;
            default: canvas.drawCircle(12,12,8,paint);path(canvas,8,12,16,12);path(canvas,12,8,12,16);
        }canvas.restore();
    }
    private void pathCurveEye(Canvas canvas){Path p=new Path();p.moveTo(3,12);p.cubicTo(7,5,17,5,21,12);p.cubicTo(17,19,7,19,3,12);canvas.drawPath(p,paint);canvas.drawCircle(12,12,3,paint);}
    private void path(Canvas canvas,float... points){Path p=new Path();p.moveTo(points[0],points[1]);for(int i=2;i<points.length;i+=2)p.lineTo(points[i],points[i+1]);canvas.drawPath(p,paint);}
}
