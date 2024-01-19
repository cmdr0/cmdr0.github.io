# Reverse Engineering your BIOS

Sometimes, features will be included in a BIOS, but be hidden away or disabled completely, and RE'ing the BIOS could be an answer to enabling them.  Windows has a feature for OEMs that allows them to provide binaries via the BIOS that survive OS reinstall ([a great writeup here about exactly that](https://standa-note.blogspot.com/2021/04/reverse-engineering-absolute-uefi.html)), and device ownership means understanding what runs at every level.  Here's how to get after RE'ing your BIOS:

## Dumping your BIOS

Most, if not all modern, if not all Intel chips have a built-in programmer to access the BIOS.  You can dump them to binary quickly with `flashrom`:

```flashrom -p internal --ifd -i bios -r ./bios-dump.bin```

Here's what that means:
- `-p internal`: Internal programmer targeting the Intel programmer
- `--ifd`: Read the Intel Firmware Descriptor from flash
- `-i bios`: Include the `bios` section, as listed by the `ifd`
- `-r`: Read
- `./bios-dump.bin`: File to save to

## RE'ing your BIOS

You can use UEFITools from here to start searching for strings (like NtOpen, System32, http, etc.) and carving binaries for analysis in Ghidra.  One trick with the search function is to search with _and without_ unicode checked.

But it's also really fun to just run `strings` against it to start.
- Finding Windows product keys:
  - `strings ./bios-dump.bin | grep -e '([A-Z0-9]{5}-){4}'`
- These are a few of my favorite strings:
  - `DECOMPILATION OR DISASSEMBLY PROHIBITED`
  - `Test String`
  - `... DEBUG BUFFER OVERFLOW!!!`