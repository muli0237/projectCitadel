use std::fs;
use std::path::Path;

fn make_minimal_png(width: u32, height: u32) -> Vec<u8> {
    let mut raw_data = Vec::new();
    for _ in 0..height {
        raw_data.push(0u8); // scanline filter None
        for _ in 0..width {
            // Dark navy (#0a101a) with cyan highlight (#39d9ff)
            raw_data.extend_from_slice(&[10u8, 16u8, 26u8, 255u8]);
        }
    }

    fn crc32(data: &[u8]) -> u32 {
        let mut crc = 0xFFFF_FFFFu32;
        for &byte in data {
            crc ^= byte as u32;
            for _ in 0..8 {
                if crc & 1 != 0 {
                    crc = (crc >> 1) ^ 0xEDB8_8320;
                } else {
                    crc >>= 1;
                }
            }
        }
        !crc
    }

    fn adler32(data: &[u8]) -> u32 {
        let mut s1 = 1u32;
        let mut s2 = 0u32;
        for &b in data {
            s1 = (s1 + b as u32) % 65521;
            s2 = (s2 + s1) % 65521;
        }
        (s2 << 16) | s1
    }

    fn make_chunk(tag: &[u8; 4], data: &[u8]) -> Vec<u8> {
        let mut chunk = Vec::new();
        chunk.extend_from_slice(&(data.len() as u32).to_be_bytes());
        chunk.extend_from_slice(tag);
        chunk.extend_from_slice(data);
        let mut crc_input = Vec::new();
        crc_input.extend_from_slice(tag);
        crc_input.extend_from_slice(data);
        chunk.extend_from_slice(&crc32(&crc_input).to_be_bytes());
        chunk
    }

    let mut out = Vec::new();
    out.extend_from_slice(b"\x89PNG\r\n\x1a\n");

    // IHDR
    let mut ihdr_data = Vec::new();
    ihdr_data.extend_from_slice(&width.to_be_bytes());
    ihdr_data.extend_from_slice(&height.to_be_bytes());
    ihdr_data.push(8); // bit depth
    ihdr_data.push(6); // RGBA
    ihdr_data.push(0); // compression
    ihdr_data.push(0); // filter
    ihdr_data.push(0); // interlace
    out.extend(make_chunk(b"IHDR", &ihdr_data));

    // IDAT (uncompressed deflate stream)
    let mut zlib_stream = Vec::new();
    zlib_stream.push(0x78);
    zlib_stream.push(0x01);

    let len = raw_data.len() as u16;
    let nlen = !len;
    zlib_stream.push(0x01); // BFINAL=1, BTYPE=00 (uncompressed)
    zlib_stream.extend_from_slice(&len.to_le_bytes());
    zlib_stream.extend_from_slice(&nlen.to_le_bytes());
    zlib_stream.extend_from_slice(&raw_data);
    zlib_stream.extend_from_slice(&adler32(&raw_data).to_be_bytes());

    out.extend(make_chunk(b"IDAT", &zlib_stream));
    out.extend(make_chunk(b"IEND", &[]));

    out
}

fn make_minimal_ico(png_data: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    // ICONDIR
    out.extend_from_slice(&[0, 0]); // Reserved
    out.extend_from_slice(&[1, 0]); // Type 1 = ICO
    out.extend_from_slice(&[1, 0]); // 1 image

    // ICONDIRENTRY
    out.push(32); // width
    out.push(32); // height
    out.push(0);  // colors
    out.push(0);  // reserved
    out.extend_from_slice(&[1, 0]); // planes
    out.extend_from_slice(&[32, 0]); // bpp
    out.extend_from_slice(&(png_data.len() as u32).to_le_bytes()); // size
    out.extend_from_slice(&22u32.to_le_bytes()); // offset (6 + 16 = 22)

    out.extend_from_slice(png_data);
    out
}

fn make_minimal_icns(png_data: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    let total_len = 8 + 8 + png_data.len() as u32;
    out.extend_from_slice(b"icns");
    out.extend_from_slice(&total_len.to_be_bytes());
    out.extend_from_slice(b"ic07"); // 128x128 PNG icon type in ICNS
    out.extend_from_slice(&(8 + png_data.len() as u32).to_be_bytes());
    out.extend_from_slice(png_data);
    out
}

fn ensure_icons() {
    let icons_dir = Path::new("icons");
    if !icons_dir.exists() {
        let _ = fs::create_dir_all(icons_dir);
    }

    let png_32 = make_minimal_png(32, 32);
    let png_128 = make_minimal_png(128, 128);

    let required_files = [
        ("icons/32x32.png", &png_32[..]),
        ("icons/64x64.png", &png_32[..]),
        ("icons/128x128.png", &png_128[..]),
        ("icons/128x128@2x.png", &png_128[..]),
        ("icons/icon.png", &png_128[..]),
        ("icons/Square30x30Logo.png", &png_32[..]),
        ("icons/Square44x44Logo.png", &png_32[..]),
        ("icons/Square71x71Logo.png", &png_32[..]),
        ("icons/Square89x89Logo.png", &png_32[..]),
        ("icons/Square107x107Logo.png", &png_128[..]),
        ("icons/Square142x142Logo.png", &png_128[..]),
        ("icons/Square150x150Logo.png", &png_128[..]),
        ("icons/Square284x284Logo.png", &png_128[..]),
        ("icons/Square310x310Logo.png", &png_128[..]),
        ("icons/StoreLogo.png", &png_32[..]),
    ];

    for (rel_path, fallback_data) in required_files {
        let p = Path::new(rel_path);
        if !p.exists() || fs::metadata(p).map(|m| m.len() == 0).unwrap_or(true) {
            let _ = fs::write(p, fallback_data);
        }
    }

    let ico_path = Path::new("icons/icon.ico");
    if !ico_path.exists() || fs::metadata(ico_path).map(|m| m.len() == 0).unwrap_or(true) {
        let ico_data = make_minimal_ico(&png_32);
        let _ = fs::write(ico_path, ico_data);
    }

    let icns_path = Path::new("icons/icon.icns");
    if !icns_path.exists() || fs::metadata(icns_path).map(|m| m.len() == 0).unwrap_or(true) {
        let icns_data = make_minimal_icns(&png_128);
        let _ = fs::write(icns_path, icns_data);
    }
}

fn main() {
    ensure_icons();
    tauri_build::build()
}
