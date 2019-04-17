# PwnAdventure3; Part 1--Containerization of the Operational Environment
### Repeatable Infrastructure: because I'm not doing this twice.
- [x] Complete draft (04/2019)
- [ ] Editing pass
- [ ] Complete series
- [ ] Post-mortem
---

## Preface

If you're just here for the RE and the C guides, and you're not trying to set this up yourself, skip this section.  If you'd rather just install everything locally, use [this guide](https://github.com/beaujeant/PwnAdventure3/blob/master/INSTALL-server.md) by [@Beaujeant](https://twitter.com/Beaujeant), or the README that comes with the server binary.  If you _are_ trying to follow along, and would like a Docker container you can spin up and down on a whim, you can continue with this guide, or use the one on [LiveOverflow's GitHub](https://github.com/LiveOverflow/PwnAdventure3) - the primary difference is that mine puts the server files into the container, rather than just linking them, and I store the database in a Docker volume rather than dumping a backup onto the host machine when it terminates (not that it was a poor implementation, I just prefer mine).

## Assumptions

I'm assuming you know Docker, have it installed, and are running Linux.

## Journey, Lessons Learned

For the most part, this was pretty straight-forward.  The README provided with the binary makes it pretty easy to make a Dockerfile for building, but one thing they don't tell you (or I missed) is that you have to run the client once first to pull all the requisite files.  Once the client updated my files, I packaged them up in a tar.gz to be moved into my container.

Dockerfile
```dockerfile
FROM ubuntu:14.04

RUN apt-get update && apt-get install -y \
  vim \
  postgresql

ENV PWN3=/opt/pwn3

RUN useradd -ms /bin/bash pwn3
RUN mkdir /opt/pwn3

ADD --chown=pwn3 PwnAdventure3Server.tar.gz $PWN3
ADD --chown=pwn3 client.tar.gz $PWN3

RUN cp $PWN3/PwnAdventure3Servers/GameServer/PwnAdventure3Server $PWN3/client/PwnAdventure3_Data/PwnAdventure3/PwnAdventure3/Binaries/Linux/

ADD --chown=pwn3 extras.tar.gz $PWN3
RUN chown -R pwn3 /opt/pwn3

EXPOSE 3333
```

`extras.tar.gz` was actually a small pile of init-stuff that needed to be run to 'prime' the container for use:

init<span>.</span>sh - We have to initialize our commands with `su <user> -c` because our Dockerfile leaves initial execution as `root` - but this is also required so that we can act in this script on behalf of both users `postgres` and `pwn3`.  Additionally, this drops our server creds into `/opt/pwn3/creds` in the Docker container - this is important, and we'll retrieve these with our first run.
```sh
#!/bin/bash

$PWN3 = "/opt/pwn3/"

su postgres -c "psql -f $PWN3/postgres_init.sql -d template1"
su pwn3 -c "psql master -f $PWN3/PwnAdventure3Servers/MasterServer/initdb.sql"
su pwn3 -c "psql master -f $PWN3/postgres_extra.sql"
su pwn3 -c "$PWN3/PwnAdventure3Servers/MasterServer/MasterServer --create-server-account >> $PWN3/creds"
su pwn3 -c "$PWN3/PwnAdventure3Servers/MasterServer/MasterServer --create-admin-team Admin >> $PWN3/creds"
```
postgres_init.sql:
```sql
CREATE USER pwn3;
CREATE DATABASE master;
GRANT ALL PRIVILEGES ON DATABASE master to pwn3;
```
postgres_extra.sql:
```sql
UPDATE info SET contents='Cmdr0s Pwnie Island Server' WHERE name='login_title';
UPDATE info SET contents='Enjoy your stay at Pwnie Island!' WHERE name='login_text';
```

Those are all the code blocks that make up the container - all that's left is to spin up somewhere to store the Postgres data.  This is actually where I ran into a huge snag...

## Lesson - Docker Volumes vs Bind Mounts

Up to this point, I had always used Docker's Bind Mounting - basically, mounting a local directory onto the container much like you would a USB drive on a Linux host.  This became an issue, because Postgres stores its databases/data in the same directory as a bunch of mandatory information - now, I'm sure there's a configuration I'm missing that makes it _not_ do that, considering they've got a PostgreSQL Docker container out on Docker Hub, but that'll have to wait for my next run-in with it.

Anyway, the problem was that I wanted to mount a folder on my local machine into PostgreSQL's `main` directory, so that its writes would propogate locally, and I'd have a real-time backup.  However, not only did my empty local directory not have the required Postgres files for it to run, but on bind-mounting it, I obscured the files that _did_ exist on the container, too.  This is standard behavior for Docker bind mounts.

Enter Docker Volumes.  Tucked away in its [documentation](https://docs.docker.com/storage/volumes/#populate-a-volume-using-a-container), it's noted:

>If you start a container which creates a new volume, as above, and the container has files or directories in the directory to be mounted (such as /app/ above), the directory’s contents are copied into the volume. The container then mounts and uses the volume, and other containers which use the volume also have access to the pre-populated content.

So, in our case, the easiest way to handle the pre-populated data that Postgres needs to run is to spin up a Docker volume.

`docker volume create pwn3postgres`

## Back to the Action

After conquering that hurdle, the rest was fairly simple.  Run `docker-compose -f init-compose.yml up`/`down` using (something akin to) the below file...

init-compose.yml:
```yaml
version: '3.5'
services: 
  master:
    image: pwn3server:latest
    hostname: master.pwn3
    volumes:
      - type: volume
        source: pwn3postgres
        target: /var/lib/postgresql/9.3/main
      - ./data/creds:/opt/pwn3/creds
    command: "bash -c 'service postgresql start && /opt/pwn3/init.sh'"
    tty: true
    stdin_open: true
volumes:
  pwn3postgres:
    external: true
```

Pull the server credentials and pop them into `data/server.ini`, similar to below:

server.ini - `Instances=5` can really be any >0 number, but when I didn't define a number, the Docker container pinned my CPU and turned my laptop into a space heater.
```ini
[MasterServer]
Hostname=master.pwn3
Port=3333

[GameServer]
Hostname=game.pwn3
Port=3000
Username=server_8675aaa309999999
Password=a1b2c3d4e5f6a7b8c9d0e1f2
Instances=5
```

Once you've done that, (something akin to) the file below should give you everything you need to run your game server on Docker.

docker-compose.yml:
```yaml
version: '3.5'
services: 
  master:
    image: pwn3server:latest
    hostname: master.pwn3
    volumes:
      - type: volume
        source: pwn3postgres
        target: /var/lib/postgresql/9.3/main
    networks:
      default:
        aliases:
          - "master.pwn3"
    ports:
      - 3333:3333
    command: ["bash", "-c", "service postgresql start && su pwn3 -c 'cd /opt/pwn3/PwnAdventure3Servers/MasterServer && ./MasterServer'"]
  game:
    image: pwn3server:latest
    hostname: game.pwn3
    volumes:
      - ./data/server.ini:/opt/pwn3/client/PwnAdventure3_Data/PwnAdventure3/PwnAdventure3/Content/Server/server.ini
    networks:
      default:
        aliases:
          - "game.pwn3"
    ports:
      - 3000-3010:3000-3010
    command: "su pwn3 -c 'cd /opt/pwn3/client/PwnAdventure3_Data/PwnAdventure3/PwnAdventure3/Binaries/Linux && ./PwnAdventure3Server'"
    depends_on:
      - master
volumes:
  pwn3postgres:
    external: true
```

## Parting Shots

Once your server is up and running, you'll have to make a similar `server.ini` file, without the username and password, and place it in your client directory (`PwnAdventure3_Data/PwnAdventure3/PwnAdventure3/Content/Server/server.ini`) - and then finally, you'll have to edit your `/etc/hosts` file to point `game.pwn3` and `master.pwn3` to the correct IP (127.0.0.1, by this config).