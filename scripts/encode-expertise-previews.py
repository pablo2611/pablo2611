"""Encode browser captures of the actual Next.js components into README previews.

Usage: python scripts/encode-expertise-previews.py /absolute/path/to/frames
The capture strip is 820 x 264; three 268px cards separated by 8px.
"""
import json
import sys
from pathlib import Path
from PIL import Image

frames_dir = Path(sys.argv[1])
assets = Path(__file__).resolve().parents[1] / 'assets'
times = json.loads((frames_dir / 'timing.json').read_text())
durations = [max(50, round((b-a)/10)*10) for a,b in zip(times,times[1:])]
durations.append(durations[-1])
sources = [Image.open(path).convert('RGB') for path in sorted(frames_dir.glob('*.jpg'))]
for name, left in [('infrastructure',0),('automation',276),('web',552)]:
    frames = [frame.crop((left,0,left+268,264)) for frame in sources]
    frames[0].save(assets / f'expertise-{name}-poster.png', optimize=True)
    palette = frames[0].quantize(colors=128)
    encoded = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    target = assets / f'expertise-{name}-motion.gif'
    encoded[0].save(target, save_all=True, append_images=encoded[1:], duration=durations, loop=0, optimize=True, disposal=1)
    print(f'{name}: {target.stat().st_size / 1024:.0f} KB, {len(frames)} frames')
