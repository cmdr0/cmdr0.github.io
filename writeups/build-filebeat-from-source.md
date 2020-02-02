# Build Filebeat from Source (and Update their Docker Container)

As an alternative to making the following directory structure, you can just change the `$GOROOT` or `$GOPATH` variables to where your source is pulled to

`mkdir -p ~/go/src/github.com/elastic/`

`cd ~/go/github.com/elastic/`

`git clone https://github.com/elastic/beats/`

`cp -r ./beats/x-pack/zeek ./beats/filebeat/module/`

Arch: `pacman -S go-pie`

Arch (requires `yay`, or your AUR manager of choice): `yay -S mage`

`cd beats/filebeat`

`make update`

`make`

`./filebeat modules enable zeek` /or/ `mv ./modules.d/zeek.yml.disabled ./modules.d/zeek.yml`