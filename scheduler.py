import time
from apscheduler.schedulers.background import BackgroundScheduler
import runpy

def run_pipeline():
    print("\n[Scheduler] เริ่มต้นกระบวนการดึงข่าวและวิเคราะห์ AI อัตโนมัติ...")
    try:
        runpy.run_module("main", run_name="__main__")
        print("[Scheduler] ทำงานรอบปัจจุบันเสร็จสมบูรณ์!")
    except Exception as e:
        print(f"[Scheduler] เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    
    # ตั้งเวลาให้รันฟังก์ชัน run_pipeline ทุกๆ 1 ชั่วโมง
    scheduler.add_job(run_pipeline, 'interval', hours=1)
    
    # รันทันที 1 รอบแรกตอนเปิดโปรแกรม
    run_pipeline()
    
    scheduler.start()
    print("(ระบบจะรันอัตโนมัติทุกๆ 1 ชั่วโมง - กด Ctrl+C เพื่อเลิก)")

    # ป้องกันไม่ให้ script ปิดตัวเอง
    try:
        while True:
            time.sleep(2)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        print("\nหยุดการทำงานของ Scheduler ")