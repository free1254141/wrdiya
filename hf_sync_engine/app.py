#!/usr/bin/env python3
"""
Hugging Face (HF) Space Entrypoint - Aqar AI Real Estate Sync Hub
Provides an interactive dashboard and periodic background scheduler
to synchronize properties into Supabase automatically.
"""

import os
import sys
import threading
import time
from datetime import datetime
from sync_worker import run_sync, SUPABASE_URL

# Fix UTF-8 for consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Try importing Gradio for interactive HF Space web UI
try:
    import gradio as gr
    GRADIO_AVAILABLE = True
except ImportError:
    GRADIO_AVAILABLE = False

def trigger_manual_sync():
    """Manual sync triggered from Hugging Face UI"""
    success, count = run_sync()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if success:
        return f"✅ تم التحديث بنجاح في {now_str} — تمت مزامنة {count} وحدة معتمدة وحقن روابط الأفلييت في سوبابيز مباشرة."
    else:
        return f"❌ حدث خطأ أثناء المزامنة في {now_str}، راجع سجلات التشغيل."

def get_status_info():
    """Display environment status"""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return f"""
    🏢 **خادم مزامنة بيانات عقار AI (Hugging Face Sync Worker)**
    
    - **قاعدة البيانات**: متصل بـ Supabase (`{SUPABASE_URL}`)
    - **كود وسيط عقارماب المعتمد**: `759279`
    - **كود شريك TEKCE المعتمد**: `6FPC68983C`
    - **دور Vercel**: استضافة الشات بوت وتكييش البيانات الخفيفة فقط بدون معالجة ثقيلة.
    - **التوقيت الحالي للتشغيل**: {now_str}
    """

def background_scheduler():
    """Runs periodic sync in background every 24 hours"""
    while True:
        try:
            print("🕒 Scheduled sync triggered...")
            run_sync()
        except Exception as e:
            print(f"Scheduler error: {e}")
        # Sleep for 24 hours
        time.sleep(24 * 3600)

# Start background thread
thread = threading.Thread(target=background_scheduler, daemon=True)
thread.start()

if __name__ == "__main__":
    if GRADIO_AVAILABLE:
        with gr.Blocks(title="Aqar AI - Sync Worker Hub") as demo:
            gr.Markdown("# 🏢 عقار AI — محرك سحب ومزامنة البيانات اليومي (HF Sync Hub)")
            gr.Markdown("يقوم هذا الخادم بسحب وتحديث قوائم العقارات من عقارماب وTEKCE وتجهيز روابط الأفلييت وتخزينها في Supabase تلقائياً.")

            status_box = gr.Markdown(value=get_status_info())
            
            sync_btn = gr.Button("🔄 مزامنة البيانات الآن (Sync to Supabase Now)", variant="primary")
            output_box = gr.Textbox(label="حالة المزامنة الأخيرة", interactive=False)

            sync_btn.click(fn=trigger_manual_sync, inputs=[], outputs=[output_box])

        demo.launch(server_name="0.0.0.0", server_port=7860)
    else:
        print("Gradio not installed, running initial sync and entering daemon loop...")
        run_sync()
        while True:
            time.sleep(3600)
