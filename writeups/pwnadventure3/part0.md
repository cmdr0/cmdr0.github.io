# PwnAdventure3; Part 0--Flight Path
### Practical Reverse Engineering using an Intentionally Vulnerable MMORPG
- [x] Complete draft (2019/04)
- [ ] Editing pass
- [ ] Complete series
- [ ] Post-mortem
---

## Introduction

I originally heard about Pwn Adventure 3 from [LiveOverflow's amazing YouTube series](https://www.youtube.com/playlist?list=PLhixgUqwRTjzzBeFSHXrw9DnQtssdAwgG) on the topic.  Pwnie Island was a challenge set for [Ghost in the Shellcode 2015](http://ghostintheshellcode.com/), featuring an intentionally-vulnerable mock MMORPG, complete with server and client components.  From the [Pwn Adventure 3 site](http://www.pwnadventure.com/):

> Pwn Adventure 3: Pwnie Island is a limited-release, first-person, true open-world MMORPG set on a beautiful island where anything could happen. That's because this game is intentionally vulnerable to all kinds of silly hacks! Flying, endless cash, and more are all one client change or network proxy away.

Because it would be too easy to just copy LiveOverflow's procedures and conclusions, my intention with this write-up is to go a layer or two deeper and explain reverse engineering, assembly, and C by way of my experiences with this challenge.

## Rules of Engagement

- The game client, environment it runs in, and network traffic are in-bounds.
- The server process, and the environment it runs in, are no-strike.
- Any tools developed will be developed in C.
- All 7 flags from the [original scoreboard](http://ghostintheshellcode.com/2015-final/) (Choose Your Pwn Adventure 3) are required for completion.

With that out of the way, let's begin.