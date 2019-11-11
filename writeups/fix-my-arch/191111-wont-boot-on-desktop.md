# My USB Install Won't Find the Root FS on my Desktop PC

## Things I Learned/Things to Highlight:
- `mkinitcpio.conf` hook ordering.
- The Arch Wiki is the best Linux resource.

## Symptom:

During boot on my old, BIOS-only (UEFI-absent) desktop, I get something along the lines of...
```
Waiting 10 seconds for <root_fs_UUID>...
```
...before getting dumped into a busybox shell where I have no keyboard.

BUT

The 'fallback' entry works fine.

## Go:

Okay, yeah, turns out the Arch wiki has me beat on this. [See it here!](https://wiki.archlinux.org/index.php/Installing_Arch_Linux_on_a_USB_key#Installation_tweaks)

Important piece:

> Before creating the initial RAM disk, in `/etc/mkinitcpio.conf` move the `block` and `keyboard` hooks before the `autodetect` hook. This is necessary to allow booting on multiple systems each requiring different modules in early userspace

Okay, yeah, let's take a look at my `/etc/mkinitcpio.conf`...

```
HOOKS=(base udev autodetect keymap consolefont keyboard block modconf encrypt lvm2 filesystems fsck)
```

Alright, so the fix...

```
HOOKS=(base udev block keyboard autodetect keymap consolefont modconf encrypt lvm2 filesystems fsck)
```

And then when I go to [check the wiki]() to make sure I'm running `mkinitcpio` correctly, I find out why the fallback entry works anyway...

> By default, the mkinitcpio script generates two images after kernel installation or upgrades: a default image, and a fallback image that skips the autodetect hook

Alright, let's rebuild our initramfs...es

```
$ sudo mkinitcpio -P
```

And a reboot shows it works like a charm.