package io.github.meyer4.secondlook;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.View;

/** Low-rate foreground visuals only. The notification listener never starts this. */
abstract class PrismMotionView extends View {
    private final Handler handler=new Handler(Looper.getMainLooper());
    private boolean foreground=true, scheduled=false;
    protected float phase=0;
    PrismMotionView(Context context){super(context);setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);}
    private final Runnable frame=new Runnable(){public void run(){scheduled=false;if(shouldAnimate()){phase+=.065f;invalidate();schedule();}}};
    private boolean shouldAnimate(){return foreground&&isAttachedToWindow()&&getWindowVisibility()==VISIBLE&&hasWindowFocus()&&NativeUi.motionAllowed(getContext());}
    private void schedule(){if(shouldAnimate()&&!scheduled){scheduled=true;handler.postDelayed(frame,80);}}
    private void stop(){handler.removeCallbacks(frame);scheduled=false;}
    void setForeground(boolean visible){foreground=visible;if(visible)schedule();else stop();}
    boolean isAnimationScheduled(){return scheduled;}
    @Override protected void onAttachedToWindow(){super.onAttachedToWindow();schedule();}
    @Override protected void onDetachedFromWindow(){stop();super.onDetachedFromWindow();}
    @Override public void onWindowFocusChanged(boolean focus){super.onWindowFocusChanged(focus);if(focus)schedule();else stop();}
    @Override protected void onWindowVisibilityChanged(int visibility){super.onWindowVisibilityChanged(visibility);if(handler==null)return;if(visibility==VISIBLE)schedule();else stop();}
}
