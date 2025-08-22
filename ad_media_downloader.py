#!/usr/bin/env python3
"""
Facebook Ad Media Downloader
Downloads images and videos from Facebook ad URLs
"""

import requests
import os
import time
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import json
import argparse
import sys


class FacebookAdDownloader:
    def __init__(self, download_dir="./downloads"):
        self.download_dir = download_dir
        self.session = requests.Session()

        # Set headers to mimic a real browser
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }
        )

        # Create download directory
        os.makedirs(download_dir, exist_ok=True)

    def extract_file_id(self, url):
        """Extract a unique identifier from Facebook URL"""
        try:
            if "fbcdn.net" in url:
                # Extract from the path
                path_parts = urlparse(url).path.split("/")
                for part in path_parts:
                    if len(part) > 10 and ("_" in part or part.isalnum()):
                        return part.split("_")[0][:12]
            return str(int(time.time()))
        except:
            return str(int(time.time()))

    def get_file_extension(self, url, content_type=None):
        """Determine file extension from URL or content type"""
        if content_type:
            if "image/jpeg" in content_type or "image/jpg" in content_type:
                return "jpg"
            elif "image/png" in content_type:
                return "png"
            elif "video/mp4" in content_type:
                return "mp4"
            elif "image/webp" in content_type:
                return "webp"

        # Fallback to URL extension
        if ".jpg" in url or ".jpeg" in url:
            return "jpg"
        elif ".png" in url:
            return "png"
        elif ".mp4" in url:
            return "mp4"
        elif ".webp" in url:
            return "webp"
        else:
            return "bin"  # Binary fallback

    def download_media(self, url, media_type="unknown", custom_filename=None):
        """Download a single media file"""
        try:
            print(f"Downloading {media_type}: {url[:80]}...")

            # Make request with stream=True for large files
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            # Get content type and file extension
            content_type = response.headers.get("content-type", "")
            file_extension = self.get_file_extension(url, content_type)

            # Generate filename
            if custom_filename:
                filename = custom_filename
                # Ensure it has the correct extension
                if not filename.endswith(f'.{file_extension}'):
                    base_name = os.path.splitext(filename)[0]
                    filename = f"{base_name}.{file_extension}"
            else:
                file_id = self.extract_file_id(url)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"fb_ad_{media_type}_{timestamp}_{file_id}.{file_extension}"
            
            filepath = os.path.join(self.download_dir, filename)

            # Download and save file
            total_size = int(response.headers.get("content-length", 0))
            downloaded_size = 0

            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)

                        # Show progress for large files
                        if (
                            total_size > 0 and downloaded_size % (1024 * 1024) == 0
                        ):  # Every MB
                            progress = (downloaded_size / total_size) * 100
                            print(f"  Progress: {progress:.1f}%")

            file_size = os.path.getsize(filepath)
            print(f"✅ Success: {filename} ({file_size:,} bytes)")

            return {
                "status": "success",
                "filename": filename,
                "filepath": filepath,
                "size": file_size,
                "type": media_type,
                "url": url,
                "content_type": content_type,
            }

        except requests.exceptions.RequestException as e:
            print(f"❌ Download failed: {e}")
            return {"status": "failed", "error": str(e), "url": url, "type": media_type}
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return {"status": "failed", "error": str(e), "url": url, "type": media_type}

    def download_batch(self, urls_and_types, delay=1):
        """Download multiple media files with optional delay"""
        results = []

        for i, (url, media_type) in enumerate(urls_and_types):
            print(f"\\n[{i + 1}/{len(urls_and_types)}]")
            result = self.download_media(url, media_type)
            results.append(result)

            # Add delay between downloads to be respectful
            if delay > 0 and i < len(urls_and_types) - 1:
                print(f"Waiting {delay} seconds...")
                time.sleep(delay)

        return results


def main():
    parser = argparse.ArgumentParser(description='Facebook Ad Media Downloader')
    parser.add_argument('--single-url', help='Download a single URL')
    parser.add_argument('--output-dir', default='./fb_ad_downloads', help='Output directory')
    parser.add_argument('--filename', help='Custom filename for single download')
    parser.add_argument('--media-type', default='unknown', choices=['image', 'video', 'unknown'], 
                       help='Media type for single download')
    
    args = parser.parse_args()
    
    # Initialize downloader
    downloader = FacebookAdDownloader(download_dir=args.output_dir)
    
    if args.single_url:
        # Single URL download mode
        print("🚀 Starting Single File Download...")
        print(f"URL: {args.single_url}")
        print(f"Download directory: {os.path.abspath(downloader.download_dir)}")
        
        result = downloader.download_media(args.single_url, args.media_type, args.filename)
        
        if result["status"] == "success":
            print(f"✅ Download completed: {result['filename']} ({result['size']:,} bytes)")
            sys.exit(0)
        else:
            print(f"❌ Download failed: {result['error']}")
            sys.exit(1)
    
    # Original batch mode
    media_urls = [
        (
            "https://scontent-atl3-1.xx.fbcdn.net/v/t39.35426-6/532378749_3950423875267589_3355186878584971694_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=c53f8f&_nc_ohc=qw_FGEQFPKAQ7kNvwFYOHbo&_nc_oc=AdmPgfClr6ndcJLMf3lwMTtWEqNTf2R4z9YwnpF56j7yEdhJPb-wm-W1HcBJSRp8cXI&_nc_zt=14&_nc_ht=scontent-atl3-1.xx&_nc_gid=UZ35u6qwh_tTxEl__fc88w&oh=00_AfUylZ2wFt-HinVdhn-D368UxemM5vhEjBQOeDv6-GhgpA&oe=68AD9709",
            "image",
        ),
        (
            "https://video-atl3-3.xx.fbcdn.net/o1/v/t2/f2/m366/AQOOO5JiUlqrfVnipD7FSJcnmVtEU8Q8vA2dCMShyOsfAiiu0LGoYSWh4KkTLbTR-Sligi-Fb2tX4zdrSw2mU0MZ0DyVSEfPAS5WJ11l-TMv9A.mp4?_nc_cat=107&_nc_sid=5e9851&_nc_ht=video-atl3-3.xx.fbcdn.net&_nc_ohc=yl3iG2iyNm4Q7kNvwEPDs-j&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5WSV9VU0VDQVNFX1BST0RVQ1RfVFlQRS4uQzMuNzIwLmRhc2hfaDI2NC1iYXNpYy1nZW4yXzcyMHAiLCJ4cHZfYXNzZXRfaWQiOjU0NTk3NzMyODU0MzAyOSwidmlfdXNlY2FzZV9pZCI6MTA3OTksImR1cmF0aW9uX3MiOjMwLCJ1cmxnZW5fc291cmNlIjoid3d3In0%3D&ccb=17-1&vs=294c25cdec5cfbf5&_nc_vs=HBksFQIYRWZiX2VwaGVtZXJhbC9CRTQyNjlCRkVFMTUwMjFCMzBBNzlFRUY0NjlGNjc5Ml9tdF8xX3ZpZGVvX2Rhc2hpbml0Lm1wNBUAAsgBEgAVAhhFZmJfZXBoZW1lcmFsLzU0NDA2NDU0QjRBOUJEQzE2QzAzM0Y2RTcxOEZFNzk2X210XzBfYXVkaW9fZGFzaGluaXQubXA0FQICyAESACgAGAAbAogHdXNlX29pbAExEnByb2dyZXNzaXZlX3JlY2lwZQExFQAAJuqUyYuIpPgBFQIoAkMzLBdAPhItDlYEGRgZZGFzaF9oMjY0LWJhc2ljLWdlbjJfNzIwcBEAdQBl3qgBAA&_nc_gid=UZ35u6qwh_tTxEl__fc88w&_nc_zt=28&oh=00_AfXq8_2QHJ2YJlJ8KdELcxJ8KmRYUdpm0RXhQcpUJPvEdQ&oe=68AD898D",
            "video",
        ),
    ]

    print("🚀 Starting Facebook Ad Media Download...")
    print(f"Download directory: {os.path.abspath(downloader.download_dir)}")

    # Download all media
    results = downloader.download_batch(media_urls, delay=2)

    # Summary
    successful = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] == "failed"]

    print(f"\\n📊 Download Summary:")
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")

    if successful:
        print(f"\\n📁 Downloaded files:")
        for result in successful:
            print(f"  - {result['filename']} ({result['size']:,} bytes)")

    if failed:
        print(f"\\n❌ Failed downloads:")
        for result in failed:
            print(f"  - {result['url'][:60]}... Error: {result['error']}")

    # Save results to JSON
    with open(os.path.join(downloader.download_dir, "download_log.json"), "w") as f:
        json.dump(
            {
                "timestamp": datetime.now().isoformat(),
                "total": len(results),
                "successful": len(successful),
                "failed": len(failed),
                "results": results,
            },
            f,
            indent=2,
        )

    print(f"\\n📋 Full log saved to: download_log.json")


if __name__ == "__main__":
    main()
