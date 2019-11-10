# `code-1.40.0-1` fails to update

Resolved: YES

## Things I Learned/Things to Highlight:
- Package databases can de-sync from reality
- `pacman -U` can allow you to specify exactly the package you want from a mirror
- `pacman --ignore=<package_name>` is a good way to get through an update when a rogue package is holding things up

## Symptom:

```
$ sudo pacman -Syyu
...
Packages (1) code-1.40.0-1
...
error: failed retrieving file 'code-1.40.0-1-x86_64.pkg.tar.xz' from mirrors.evowise.com : The requested URL returned error: 404
error: failed retrieving file 'code-1.40.0-1-x86_64.pkg.tar.xz' from mirror.venturasystems.tech : The requested URL returned error: 500
error: failed retrieving file 'code-1.40.0-1-x86_64.pkg.tar.xz' from mirrors.kernel.org : The requested URL returned error: 404
error: failed retrieving file 'code-1.40.0-1-x86_64.pkg.tar.xz' from mirror.kaminski.io : The requested URL returned error: 404
error: failed retrieving file 'code-1.40.0-1-x86_64.pkg.tar.xz' from arch.mirror.constant.com : The requested URL returned error: 404
error: failed retrieving file 'code-1.40.0-1-x86_64.pkg.tar.xz' from mirror.wdc1.us.leaseweb.net : The requested URL returned error: 404
warning: failed to retrieve some files
error: failed to commit transaction (failed to retrieve some files)
Errors occurred, no packages were upgraded.
```

## Go:

Originally, this was installed from `yay`/the AUR, so it's possible that it's fallen out of sync; maybe I'll just upgrade it through `yay`

[Except `yay` is broken](/writeups/fix-my-arch/191110-yay-cant-run.md)

Okay, I just spent some time fixing `yay`, but it turns out that `code` is in the Arch community repo now.  `pacman` is attempting to grab 1.40.0-1, but according to the wiki, 1.40.0-3 is the newest (as of, no joke, today - probably part of my problem).  Let's try installing that package directly

```
$ sudo pacman -U https://mirrors.edge.kernel.org/archlinux/community/os/x86_64/code-1.40.0-3-x86_64.pkg.tar.xz
...
warning: cannot resolve "electron6", a dependency of "code"
```

Alright

```
$ sudo pacman -U https://mirrors.edge.kernel.org/archlinux/community/os/x86_64/electron6-6.1.4-1-x86_64.pkg.tar.xz
```

That worked, circle back to installing `code`

```
$ sudo pacman -U https://mirrors.edge.kernel.org/archlinux/community/os/x86_64/code-1.40.0-3-x86_64.pkg.tar.xz
```

That worked.  It looks like both `electron6` and `code` had an update today, and must not have been added correctly to the package databases.  [Opened a bug report](https://bugs.archlinux.org/task/64452) on Arch's bugtracker, I'm sure someone will correct me if that wasn't right.
