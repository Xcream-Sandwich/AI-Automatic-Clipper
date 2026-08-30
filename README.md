# AI Automatic Clipper

Automated video clip generator powered by AI. Intelligently detects highlights, extracts key moments, and creates shareable clips from long-form video content with intelligent editing and segmentation.

## Overview

AI Automatic Clipper is a powerful tool designed to automatically extract the best moments from your long-form video content. Whether you're a content creator, streamer, or video producer, this tool helps you save time by intelligently identifying highlights and generating shareable clips.

## Features

- Automatic Highlight Detection: AI-powered analysis to identify the most engaging moments in your videos
- Intelligent Segmentation: Automatically segments videos into meaningful clips based on content analysis
- Batch Processing: Process multiple videos simultaneously
- Customizable Parameters: Adjust sensitivity, clip length, and extraction criteria
- Multiple Format Support: Export clips in various video formats
- Video Metadata Extraction: Automatically captures important information from source videos
- Smart Editing: Basic editing capabilities including transitions and effects
- Easy Integration: Simple API and command-line interface for seamless integration

## Installation

Requirements:
- Python 3.8 or higher
- FFmpeg installed on your system
- GPU support (NVIDIA CUDA) recommended for faster processing

Clone the repository:

```bash
git clone https://github.com/Xcream-Sandwich/AI-Automatic-Clipper.git
cd AI-Automatic-Clipper
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Quick Start

Basic usage to generate clips from a video:

```bash
python clipper.py --input video.mp4 --output clips/
```

With custom parameters:

```bash
python clipper.py --input video.mp4 --output clips/ --sensitivity high --min-duration 10 --max-duration 120
```

## Configuration

Edit `config.yaml` to customize:

- Model selection for highlight detection
- Minimum and maximum clip duration
- Sensitivity level for moment detection
- Output format and quality settings
- Processing threads and GPU usage
- Metadata extraction options

Example configuration:

```yaml
model: yolov8-highlights
min_clip_duration: 15
max_clip_duration: 120
sensitivity: medium
output_format: mp4
gpu_enabled: true
batch_size: 4
```

## Usage Examples

Extract clips from a YouTube video:

```bash
python clipper.py --input "https://youtube.com/watch?v=..." --output clips/
```

Process entire directory:

```bash
python clipper.py --input videos/ --output clips/ --recursive
```

Custom moment detection:

```bash
python clipper.py --input video.mp4 --output clips/ --detection-model custom --weights model.pth
```

## Supported Video Formats

Input: MP4, MKV, AVI, MOV, FLV, WEBM, WMV
Output: MP4 (H.264, H.265), MKV, AVI, MOV, WEBM

## How It Works

1. Video Ingestion: Upload or provide path to your video file
2. Feature Extraction: AI model analyzes video frames and audio for highlights
3. Moment Detection: Identifies peaks and transitions indicating key moments
4. Clip Generation: Automatically extracts and segments video clips
5. Post-Processing: Applies transitions, effects, and optimization
6. Export: Saves clips in your preferred format

## Performance

- Processing Speed: Depends on video length and hardware (typically 1-3x real-time on GPU)
- Accuracy: High-precision moment detection trained on diverse content
- Memory Usage: Optimized for efficient processing with streaming capabilities
- Batch Processing: Handle multiple videos efficiently

## API Reference

Python API usage:

```python
from clipper import VideoClipper

clipper = VideoClipper(model='yolov8-highlights')
clips = clipper.extract_clips(
    input_path='video.mp4',
    output_dir='clips/',
    sensitivity='high'
)
```

## Output

Generated clips include:

- Video file in selected format
- Metadata JSON file with timestamps and confidence scores
- Thumbnail image for each clip
- Optional subtitle/caption file

## Troubleshooting

Video processing fails:
- Ensure FFmpeg is properly installed and in PATH
- Check video format compatibility
- Verify sufficient disk space for output

Slow processing:
- Enable GPU acceleration if available
- Reduce batch size if running out of memory
- Check system resource availability

Model loading errors:
- Download required model weights: `python download_models.py`
- Verify internet connection for first-time setup
- Check model file integrity

## Dependencies

- FFmpeg (video processing)
- PyTorch (deep learning framework)
- OpenCV (computer vision)
- MoviePy (video manipulation)
- NumPy (numerical computing)
- Pandas (data processing)

See requirements.txt for full dependency list with versions.

## Limitations

- Limited support for very long videos (over 12 hours) without segmentation
- Accuracy depends on video quality and content type
- Real-time processing not supported for extremely high-resolution videos
- Watermark removal is not supported

## Future Enhancements

- Web interface for easy video upload and processing
- Multi-language subtitle generation
- Social media optimization (platform-specific aspect ratios)
- Advanced color grading and filter effects
- Automatic music and sound effect recommendations
- Real-time preview and editing interface
- Cloud processing support
- Mobile app version

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Make your changes and commit (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For questions, issues, or suggestions:
- Open an Issue on GitHub
- Start a Discussion for questions and ideas
- Check existing issues for known problems and workarounds

## Acknowledgments

- PyTorch and OpenCV communities
- YOLOv8 framework by Ultralytics
- FFmpeg for robust video processing
- Contributors and users providing feedback

## Author

Xcream-Sandwich
- GitHub: https://github.com/Xcream-Sandwich

---

Made for content creators who value their time and quality output.
