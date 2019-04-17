# Attempting QEMU on Windows
- [ ] Complete draft
- [ ] Editing pass
- [ ] Post-mortem

## Table of Contents
1. [Rationale](#rationale)
1. [Roadblocks](#roadblocks)
1. [The Journey](#the-journey)
   1. [Starting Out](#starting-out)
   1. [Custom VM from ISO Install](#custom-vm-from-iso-install)

## Rationale
- Have a Windows laptop for gaming, need it to do virtualization
  - Don't want to dual-boot, I always end up 'living' in one OS
  - Can't just virtualize Windows, GPU passthrough doesn't work w/laptop architecture
- Portability to/from work laptop (running QEMU/KVM)
- No licensing issues!
  - VirtualBox extras are licensed differently than VirtualBox?
  - VMWare is costly (personally; work uses it in production)
  - Hyper-V is great, but the laptop came with Win10 Home
    - I could 'forever-trial' Pro, but I'm pretty attached to my desktop background
    - Home -> Pro upgrade costs the same as an outright purchase
- This is cool
  - QEMU Portable makes your virtualization OS, software, and root-permissions agnostic (?!)
  - Pioneering; documentation exists, but is sparse or hard-to-find

## Roadblocks
- __(Cross-VM) Networking!__
  - Virtual NICs are available through TAP-Windows (acquired through [OpenVPN](https://openvpn.net/index.php/open-source/downloads.html)), but bridging them in Windows sucks
    - With a single VM up on a TAP interface, the connectivity between the guest and the host was good
    - Adding a second VM with a separate TAP interface did not change the connectivity to the first VM, and also had good host <-> client connectivity
    - Bridging the TAP interfaces together caused extremely intermittent host -> guest ICMP on both guests, and still did not allow the guests to talk to one another
  - QEMU's socket bindings are non-functional (in my experience)
    - QEMU's multicast socket binding returned "can't bind ip=<IP> to socket: unknown error"
      - Example:<br/>`-netdev socket,id=s1,mcast:230.0.0.1:1234` 
      - According to [this](https://bugs.launchpad.net/qemu/+bug/1744009), there's an issue in socket.c with the bind() command - Windows wants you to instead bind to a localhost and join a multicast group - [Bind Docs](https://msdn.microsoft.com/en-us/library/windows/desktop/ms737550).
        - [socket.c](https://github.com/qemu/qemu/blob/master/net/socket.c) does appear to have a bind command at line 252 that's not returning 0 (success)
        - Line 259+ seems to follow the bind documentation
        - Binding to INADDR_ANY (per the bug doc above) appears to be a wildcard bind (0.0.0.0?) that works(?)
        - Perhaps removing the "in multicast" check (lines 225-231) would allow the user to push through a local IP (127.0.0.1:12345) to bind to?
    - QEMU's TCP socket binding also doesn't work
      - Example:<br/>

            # First VM
            -netdev socket,id=s1,listen:127.0.0.1:1234
            # Second VM
            -netdev socket,id=s2,connect:127.0.0.1:1234
      - Second VM returns an error: "Can't connect socket: resource temporarily unavailable"
        - This has something to do with [non-blocking sockets](https://stackoverflow.com/questions/14370489/what-can-cause-a-resource-temporarily-unavailable-on-sock-send-command), I guess

> TODO: Move some of the above into a Networking section

- __No front-end GUI!__
  - I was hoping something like virt-manager existed for QEMU for Windows - It did in the form of QtEmu, but it's abandoned and largely non-op.
  - I thought I'd use Vagrant to get around needing a front-end manager, but short of learning Vagrant, learning Ruby, and writing a [custom provider](https://www.vagrantup.com/docs/plugins/providers.html), Windows+QEMU isn't currently supported.  Same applies to Packer.
  - The CLI to launch a machine is super long
    - This is lessened by just putting the launch command in a Powershell script

## The Journey

### Starting Out
[It all started here.](https://www.qemu.org/2017/11/22/haxm-usage-windows/)

Well, that's not entirely true.  That's the page that made me realize I could use the same virtualization core that I'd been using in Linux on my Windows machine.

The link walks through installing QEMU on Windows and using Intel's (open source?) Hardware Accelerated Execution Manager (HAXM) accelerator:
1. [Have an Intel CPU that supports Extended Page Tables (EPT)](https://ark.intel.com/Search/FeatureFilter?productType=processors&ExtendedPageTables=true)
   - Basically any late 2010 CPU or better, to include (basically?) any 'Core i'-series ([Exceptions](https://ark.intel.com/Search/FeatureFilter?productType=processors&ExtendedPageTables=false))
1. Be running Win7 or better (the tutorial assumes 64-bit, but supports 32-bit)
1. Enable Vt-X in BIOS/UEFI, disable Hyper-V in Windows
   - This works really well for Win10 Home virtualization, as indicated in the rationale
1. [Download HAXM for Windows](https://software.intel.com/en-us/articles/intel-hardware-accelerated-execution-manager-intel-haxm) and install
1. [Download QEMU for Windows](https://qemu.weilnetz.de/w64/) and install
1. Acquire a .qcow2 image file
   - They use a [Debian Wheezy](https://people.debian.org/~aurel32/qemu/amd64/) image
1. Add `C:\Program Files\qemu` to Windows Path ([HOWTO](https://stackoverflow.com/questions/44272416/how-to-add-a-folder-to-path-environment-variable-in-windows-10-with-screensho))
1. Start the VM:<br/>`> qemu-system-x86_64 -hda <QCOW2_IMAGE_PATH> -accel hax`

With that, a virt-viewer window popped up and greeted me with a sign-in window for my Debian image.

__[Return to the Table of Contents](#table-of-contents)__

### Custom VM from ISO Install

1. Create your hard drive:<br/>`> qemu-img create -f qcow2 <NAME>.qcow2 20G`
1. Create a Powershell script to start your VM

       qemu-system-x86_64 `
         -hda <PATH_TO_QCOW2> `
         -cdrom <PATH_TO_INSTALL_ISO> `
         -m 1G `
         -accel hax `
         -L Bios `
         -boot menu=on `
         -rtc base=localtime,clock=host `
         -parallel none `
         -serial none `
         -name <BOX_NAME> `
         -no-acpi `
         -no-hpet `
         -no-reboot

   - Apparently backticks (`) are Powershell's version of the backslash, allowing you to split up this one-liner into a manageable code chunk

__[Return to the Table of Contents](#table-of-contents)__