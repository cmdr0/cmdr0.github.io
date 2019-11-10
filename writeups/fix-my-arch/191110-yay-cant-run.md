# `yay` Can't Run: Missing Library: libalpm.so.11

Resolved: YES

## Things I Learned/Things to Highlight:
- Who's updating the updaters?

## Symptom:

```
$ yay -S code
yay: error while loading shared libraries: libalpm.so.11: cannot open shared object file: No such file or directory
```

## Go:

Do I have that library at all?

```
$ find / -name libalpm.so.* 2>/dev/null
/usr/lib/libalpm.so.12
/usr/lib/libalpm.so.12.0.1
```

So `yay` is looking for the wrong version.  We could try symlinking `libalpm.so.11` to `libalpm.so.12`, but `yay` isn't managed by `pacman`, so it's probably fallen out-of-date.  Probably worth a re-install.

```
$ git clone https://aur.archlinux.org/yay.git
$ cd yay
$ makepkg -si
```

Aaaand that fixed it.