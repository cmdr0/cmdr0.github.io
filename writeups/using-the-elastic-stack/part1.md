# Teaching the Elastic Stack; Part 1--Filebeat to Logstash
### Learning and teaching the Elastic Stack by way of cataloguing and enriching my Magic: The Gathering card collection data
- [x] Complete draft (2019/04)
- [ ] Editing pass
- [ ] Complete series
- [ ] Post-mortem
---

## Rationale

I need a one-stop example of ingesting and enriching data using the ElasticStack to give to others.

## Assumptions about the Audience

- Docker/docker-compose familiarity
- Ability to read/understand .yml/.yaml files
- Linux familiarity

## Setup

The short and sweet is that I need a guide that not only explains how the Elastic Stack works, but also provides examples of configuration files from start to finish to show my colleagues.  Once they see how unintimidating it is, maybe it will convince them to venture out and explore the possibilities on their own.

I'll be working with an inventory dump of some of my Magic: The Gathering cards as an example; the CSV file I'll be working with is in the following format:
```
Quantity,MultiverseID,Foil
"3","600",""
"1","391948",""
"1","407681","Foil"
...
```
The program I used to make this dump supports more verbose outputs, but making this as minimal while still being able to identify the exact card works in favor of the tutorial.  Later, we'll look at the different ways to correlate this information to larger card databases that have _all_ the information.

For those not familiar with MtG, here's what those fields mean:

- `Quantity`: Card count.
- `MultiverseID`: This is a unique identifier for _that_ card in _that_ set; doesn't matter if there's a reprint in another set that shares that name.  The only thing it can't tell us is if the card is...
- `Foil`: MultiverseID doesn't differentiate between foil and not, and there's usually a price difference between the two, so we need this field for data enrichment later.

The implementations I use might be overkill; for a flat file on a system, you could technically get away with only using Elasticsearch and Kibana to achieve same/similar results.  However, I need this to be a parallel to a distributed network monitoring implementation for it to be a meaningful example.

## The Journey

### Installing Filebeat, Logstash, Elasticsearch, and Kibana

No way I'm installing these manually when there are Docker images.  Use the Docker images.  Seriously.  _Especially_ because this is a test environment.  I'm also going to go ahead and link to the existing documentation.  After we've tested the individual parts of our pipeline, we'll build a working `docker-compose.yaml` file to house it all.

[Filebeat on Docker](https://www.elastic.co/guide/en/beats/filebeat/current/running-on-docker.html)<br/>
[Logstash on Docker](https://www.elastic.co/guide/en/logstash/current/docker.html)<br/>
[Elasticsearch on Docker](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html)<br/>
[Kibana on Docker](https://www.elastic.co/guide/en/kibana/current/docker.html)<br/>
(All version 6.6.2 at time of writing)

### Filebeat → Logstash

The first part of our pipeline is getting Filebeat to read our file and throw it, line-by-line, to Logstash to interpret.  We've already got `cardList.csv`, so now we're going to build a few config files.

`./logstash/beats.conf`:
```
input {
  beats {
    port => 5044
  }
}

output {
  stdout {}
}
```

This configuration is extremely simple; it listens for data using the [Beats input plugin](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-beats.html) on port 5044, and then outputs it to stdout using the aptly-named [stdout plugin](https://www.elastic.co/guide/en/logstash/current/plugins-outputs-stdout.html).

I'm going to go ahead and build a `docker-compose` file so that I don't have to create/modify a long `docker run` command every time I want to modify a value in this tutorial.

`./logstash/docker-compose.yml`:
```yaml
version: "3.5"
services:
  logstash:
    image: docker.elastic.co/logstash/logstash:6.6.2
    volumes:
      - ./pipeline/:/usr/share/logstash/pipeline/:ro
    networks:
      - testnet

networks:
  testnet:
    name: test_network
```

Next, we'll configure Filebeat to read the file and ship it to Logstash.

`./filebeat/filebeat.yml`:
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/cardlist.csv

output.logstash:
  hosts: ["logstash:5044"]
```

Simple enough; we have a `filebeats.inputs` entry pointed at our CSV, and we have an output destination.

And because I refuse to do anything twice...

`./filebeat/docker-compose.yml`:
```yaml
version: "3.5"
services:
  filebeat:
    image: docker.elastic.co/beats/filebeat:6.6.2
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - ../cardlist.csv:/var/log/cardlist.csv:ro
    networks:
      - testnet
    
networks:
  testnet:
    external:
      name: test_network
```

> __A Brief note about the networking:__ In a distributed, networked environment, the `./filebeat/filebeat.yml` would be configured to use an actual IP or a FQDN on the network, the `./logstash/docker-compose.yml` would have to expose its ports, and the `networks` would likely be swapped out for `network_mode: "bridge"`.  This isn't really a guide about Docker networking, though.

Because we define our Docker network in Logstash, we have to spin that one up first, then in another tab, spin up Filebeat

```
[you@yourbox logstash]$ docker-compose up
[you@yourbox filebeat]$ docker-compose up
```

After the machines spin up and output some debugging information, Logstash gets flooded with a ton of entries like this:

```
logstash_1  | {
logstash_1  |           "tags" => [
logstash_1  |         [0] "beats_input_codec_plain_applied"
logstash_1  |     ],
logstash_1  |            "log" => {
logstash_1  |         "file" => {
logstash_1  |             "path" => "/var/log/cardlist.csv"
logstash_1  |         }
logstash_1  |     },
logstash_1  |     "prospector" => {
logstash_1  |         "type" => "log"
logstash_1  |     },
logstash_1  |           "beat" => {it
logstash_1  |             "name" => "cf995ee20bd9",
logstash_1  |         "hostname" => "cf995ee20bd9",
logstash_1  |          "version" => "6.6.2"
logstash_1  |     },
logstash_1  |         "source" => "/var/log/cardlist.csv",
logstash_1  |        "message" => "\"1\",\"373671\",\"\"",
logstash_1  |         "offset" => 1495,
logstash_1  |       "@version" => "1",
logstash_1  |     "@timestamp" => 2019-03-14T23:18:16.646Z,
logstash_1  |           "host" => {
logstash_1  |         "name" => "cf995ee20bd9"
logstash_1  |     },
logstash_1  |          "input" => {
logstash_1  |         "type" => "log"
logstash_1  |     }
logstash_1  | }
```

The good news is: these are our logs!  The bad news is: they look like garbage, and what the hell is all this info?  I think the intention is to line up the arrows, but let me just take a minute to make it more readable - change the `./logstash/pipeline/beats.conf` over to `stdout { codec => json }`, run `docker-compose down` on both containers, `docker-compose up` on both containers, harvest a single log out of the mess, and throw it over to a JSON prettifier online...

(**NOTE**: I'm always grabbing the last log Logstash receives, but they aren't always received in the same order; thus, different log examples sometimes)

```json
{
   "beat":{
      "version":"6.6.2",
      "hostname":"a6470f9ad0ed",
      "name":"a6470f9ad0ed"
   },
   "log":{
      "file":{
         "path":"/var/log/cardlist.csv"
      }
   },
   "tags":[
      "beats_input_codec_plain_applied"
   ],
   "@version":"1",
   "prospector":{
      "type":"log"
   },
   "source":"/var/log/cardlist.csv",
   "message":"\"2\",\"426909\",\"\"",
   "offset":1447,
   "host":{
      "name":"a6470f9ad0ed"
   },
   "@timestamp":"2019-03-14T23:27:51.897Z",
   "input":{
      "type":"log"
   }
}
```

Alright, now we can read it.  So, second concern, what the hell is all this information?  Here's the thing: the entire log is in the `message` field prior to any transformations done by Logstash.  Everything else (except for `@timestamp`) is metadata added by Filebeat to aid in tracing the log back along the pipeline, or potentially seeing what modifications were done to the log (e.g.: `tags` contains a `beats_input_codec_plain_applied`, and if we used a different codec to parse the message and it failed, Logstash would throw a `<codec>_parsing_error` tag in there).  `@timestamp` is the system time added by Logstash (**NOTE:** not the time the log was generated, or necessarily ingested when it reaches Elasticsearch).

Alright, let's take a look at that message field
```
"message":"\"2\",\"426909\",\"\""
```

Okay, so we know our log normally looks like: `"2","426909",""`, so we can infer that the quotes that are part of our log are being escaped, causing it to look like that jumbled mess, and if you trace it out... that's exactly what's happening.  So step one is really to clear up those internal quotes, because they won't be necesary to the log, using the [Mutate filter](https://www.elastic.co/guide/en/logstash/current/plugins-filters-mutate.html), specifically the gsub command.

`./logstash/pipeline/beats.conf`:
```
input {...}

filter {
  mutate {
    gsub => ["message", "\"", ""]
  }
}

output {...}
```

Testing it out gives us `"message":"2,426909,"`, which is an improvement.  The next step is to break out that CSV into values that we'll be able to query in Elasticsearch/Kibana.  For that we'll be using the [CSV filter plugin](https://www.elastic.co/guide/en/logstash/current/plugins-filters-csv.html), where we'll just define the column headers in the order they'll be seen.

`./logstash/pipeline/beats.conf`:
```
input {...}

filter {
  mutate {...}
  csv {
    columns => ["quantity","muid","isFoil"]
  }
}

output {...}
```

Our new outputs look like this: 
```json
{
   "tags":[
      "beats_input_codec_plain_applied"
   ],
   "source":"/var/log/cardlist.csv",
   "prospector":{
      "type":"log"
   },
   "@timestamp":"2019-03-15T00:52:53.774Z",
   "log":{
      "file":{
         "path":"/var/log/cardlist.csv"
      }
   },
   "offset":1415,
   "beat":{
      "name":"3e359bca62ff",
      "version":"6.6.2",
      "hostname":"3e359bca62ff"
   },
   "host":{
      "name":"3e359bca62ff"
   },
   "muid":"398436",
   "@version":"1",
   "input":{
      "type":"log"
   },
   "message":"1,398436,",
   "isFoil":null,
   "quantity":"1"
}
```
If you look closely, there are now `quantity`, `muid`, and `isFoil` fields for our log!  The message remains intact because we never said to delete it (and honestly, unless you're really hurting for space, I wouldn't bother - if you don't use a conditional and something fails to parse correctly, you could be deleting the only method you have to retrieve that data).  We've got something to address with the `isFoil`, but first, a word.

## Cautionary Tale
As you saw, mutating off of CSVs is really, incredibly simple; you just define the columns, and maybe a couple of the other flags from the documentation that apply. For example, if you've never seen a [default bro log](https://github.com/bro/bro/blob/master/testing/btest/Baseline/doc.manual.using_bro_sandbox_01/http.log), it's just tab-separated values; just like above, you define your columns and set `separator => "  "` (I know it looks like a space, but it's an actual tab character; per the docs, you can't just specify `\t`).  Hell, the only thing that could be easier was if you swapped your log over to JSON and just applied the JSON codec - then you wouldn't even _have_ to define field names.

___EXCEPT...___

Let's take a look at [some of the field names](http://gauss.ececs.uc.edu/Courses/c6055/pdf/bro_log_vars.pdf) that come with bro's http.log, as an example
- ts
- uid
- id
- ...
- __tags__
- ...
- orig_mime_types
- resp_fuids
- resp_mime_types

Remember earlier, when we found out that Filebeat was adding some fields of its own?  One of those fields was `tags`, filled with information about what has happened to our log in an array of strings.  Additionally, `tags` is often used to... well, _tag_ records for segregation in pipelines or in indexing.  Let's take a look and see what happens if we ship a JSON log with a `tags` field like you'd likely see from bro.  I'll just give an example of the config file, and the log file I'm shipping:

`./logstash/pipeline/json.conf`:
```
input {...}

filter {
  json { source => "message" }
}

output {...}
```

`./json.log`:
```json
{
   "ts":1552777918.958248,
   "uid":"CKsKn66Y4DpfWb25j",
   ...
   "tags":[],
   ...
   "resp_mime_types":[
      "text/html"
   ]
}
```
Result...
```json
{
   "log":{
      "file":{
         "path":"/var/log/json.log"
      }
   },
   "trans_depth":1,
   "source":"/var/log/json.log",
   ...
   "tags":[],
   ...
   "resp_fuids":[
      "FYqTcb3rgwWwyAl9Of"
   ]
}
```

As you can see, the `tags` field got stomped by the JSON codec's expansion of the `message` field; our standard `"beats_input_codec_plain_applied"` is now missing.  Additionally, if you had Filebeat add any tags before shipping, they are now lost.  

If this sounds like an incredibly specific example, that's because it is - I worked on an implementation where Filebeat was collecting from a couple of IDS solutions, with bro among them.  So that Logstash knew what pipeline to send the logs through, the records were tagged with the name of their IDS (this could have been avoided by checking the `log.file.path` instead).  The records would reach Logstash's `filter` section, slide down the 'bro' pipeline, and all the `http.log`-originating records then had their tags stripped.  This became a problem when they reached the `output` section, because the tags on each record determined what index Logstash was going to ship them to in Elasticsearch.  Because the `http.log` records had _no_ tags, they simply got dropped.

## Next time, on ELASTIC STACK Z

Now that we've gone over shipping logs in Filebeat, as well as basic message parsing in Logstash, the next write-up will be focused around completing the pipeline with Elasticsearch and Kibana.  Look for that sometime soon.

# To be continued...