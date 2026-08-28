import streamlit as st
import yt_dlp
import os
import subprocess
import json
import time
from google import genai
from pydantic import BaseModel, Field

# Skema Pydantic untuk Output Terstruktur Gemini
class Clip(BaseModel):
    judul_klip: str = Field(description="Judul klip yang menarik dan viral")
    alasan_viral: str = Field(description="Alasan kenapa klip ini berpotensi viral")
    timestamp_mulai: str = Field(description="Timestamp mulai klip dalam format HH:MM:SS")
    timestamp_selesai: str = Field(description="Timestamp selesai klip dalam format HH:MM:SS")

class ClipList(BaseModel):
    klip: list[Clip] = Field(description="Daftar klip video yang direkomendasikan")

st.set_page_config(page_title="Auto-Clipper AI", page_icon="✂️")

st.title("✂️ Auto-Clipper AI")
st.write("Aplikasi Raw Clipper sederhana untuk memotong dan center-crop (9:16) video YouTube/TikTok dengan AI.")

# ================================
# SIDEBAR: Form Input
# ================================
st.sidebar.header("Konfigurasi")
api_key = st.sidebar.text_input("Gemini API Key", type="password")
video_url = st.sidebar.text_input("URL Video (YouTube/TikTok)")
num_clips = st.sidebar.selectbox("Jumlah Klip", [1, 2, 3, 4, 5])
clip_duration = st.sidebar.selectbox("Durasi Klip", ["15-30 detik", "30-60 detik"])

if st.sidebar.button("Mulai Analisis"):
    if not api_key:
        st.sidebar.error("Gemini API Key wajib diisi.")
    elif not video_url:
        st.sidebar.error("URL Video wajib diisi.")
    else:
        # Inisialisasi state baru
        st.session_state.api_key = api_key
        st.session_state.video_url = video_url
        st.session_state.num_clips = num_clips
        st.session_state.clip_duration = clip_duration
        st.session_state.step = 1
        
        # Bersihkan state dari analisis sebelumnya
        if 'video_path' in st.session_state: del st.session_state.video_path
        if 'clips_data' in st.session_state: del st.session_state.clips_data
        if 'edited_clips' in st.session_state: del st.session_state.edited_clips

# ================================
# STEP 1: Proses Unduh & AI
# ================================
if "step" in st.session_state and st.session_state.step >= 1:
    
    # 1. Unduh Video
    if "video_path" not in st.session_state:
        with st.spinner("Sedang mendownload video..."):
            try:
                ydl_opts = {
                    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
                    'outtmpl': 'downloaded_video.%(ext)s',
                    'merge_output_format': 'mp4',
                    'quiet': True,
                    'no_warnings': True
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(st.session_state.video_url, download=True)
                    video_path = ydl.prepare_filename(info)
                    st.session_state.video_path = video_path
                st.success(f"Berhasil mengunduh: {info.get('title', 'Video')}")
            except Exception as e:
                st.error(f"Gagal mengunduh video: {e}")
                st.stop()
                
    # 2. Analisis AI (Gemini)
    if "clips_data" not in st.session_state:
        with st.spinner("Menganalisis video menggunakan Gemini API..."):
            try:
                client = genai.Client(api_key=st.session_state.api_key)
                
                # Upload menggunakan File API
                video_file = client.files.upload(file=st.session_state.video_path)
                
                # Tunggu proses backend Gemini selesai
                while video_file.state.name == "PROCESSING":
                    time.sleep(2)
                    video_file = client.files.get(name=video_file.name)
                    
                if video_file.state.name == "FAILED":
                    st.error("Gemini gagal memproses file video ini.")
                    st.stop()
                
                prompt = f"""
                Kamu adalah ahli viral video editing. Analisis video ini dengan saksama.
                Temukan {st.session_state.num_clips} momen paling menarik, lucu, atau mengedukasi yang berpotensi viral.
                Setiap momen/klip harus memiliki durasi sekitar {st.session_state.clip_duration}.
                Kembalikan data klip ini dalam format JSON terstruktur.
                """
                
                response = client.models.generate_content(
                    model='gemini-2.5-pro',
                    contents=[video_file, prompt],
                    config={
                        'response_mime_type': 'application/json',
                        'response_schema': ClipList,
                        'temperature': 0.7,
                    }
                )
                
                result_json = json.loads(response.text)
                st.session_state.clips_data = result_json.get('klip', [])
                st.success("Analisis AI Selesai!")
                
            except Exception as e:
                st.error(f"Terjadi kesalahan saat memanggil Gemini API: {e}")
                st.stop()

# ================================
# STEP 2: Fase Review & Edit
# ================================
if "clips_data" in st.session_state and st.session_state.step == 1:
    st.subheader("Fase Review & Edit Timestamp")
    st.info("Koreksi timestamp jika dibutuhkan, kemudian konfirmasi untuk memotong.")
    
    edited_clips = []
    
    # Form untuk menampilkan dan mengedit setiap klip
    with st.form("review_form"):
        for i, clip in enumerate(st.session_state.clips_data):
            st.markdown(f"**🎥 Klip {i+1}: {clip['judul_klip']}**")
            st.caption(f"💡 *Alasan Viral:* {clip['alasan_viral']}")
            
            col1, col2 = st.columns(2)
            with col1:
                t_start = st.text_input(f"Waktu Mulai (HH:MM:SS)", value=clip['timestamp_mulai'], key=f"start_{i}")
            with col2:
                t_end = st.text_input(f"Waktu Selesai (HH:MM:SS)", value=clip['timestamp_selesai'], key=f"end_{i}")
                
            edited_clips.append({
                "judul_klip": clip['judul_klip'],
                "timestamp_mulai": t_start,
                "timestamp_selesai": t_end
            })
            st.divider()
            
        submit_btn = st.form_submit_button("Konfirmasi & Potong Video (Crop 9:16)")
        
        if submit_btn:
            st.session_state.edited_clips = edited_clips
            st.session_state.step = 2
            st.rerun()

# ================================
# STEP 3: Eksekusi Pemotongan FFmpeg
# ================================
if "step" in st.session_state and st.session_state.step == 2:
    st.subheader("Hasil Potongan Video (9:16)")
    
    with st.spinner("Sedang memotong dan crop video..."):
        for i, clip in enumerate(st.session_state.edited_clips):
            output_filename = f"clip_{i+1}.mp4"
            start_time = clip['timestamp_mulai']
            end_time = clip['timestamp_selesai']
            
            # Perintah FFmpeg: Potong berdasarkan waktu dan center-crop 9:16
            cmd = [
                'ffmpeg', '-y',
                '-i', st.session_state.video_path,
                '-ss', start_time,
                '-to', end_time,
                '-vf', 'crop=ih*9/16:ih',
                '-c:a', 'copy',
                output_filename
            ]
            
            try:
                # Jalankan ffmpeg di background process
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                # Tampilkan tombol unduh untuk klip yang berhasil
                with open(output_filename, "rb") as file:
                    st.download_button(
                        label=f"⬇️ Unduh Klip {i+1}: {clip['judul_klip']}",
                        data=file,
                        file_name=output_filename,
                        mime="video/mp4",
                        key=f"download_{i}"
                    )
            except subprocess.CalledProcessError as e:
                st.error(f"Gagal memotong klip {i+1}.")
                with st.expander("Lihat Error FFmpeg"):
                    st.code(e.stderr.decode())
