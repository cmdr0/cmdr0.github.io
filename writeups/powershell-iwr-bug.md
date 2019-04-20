# Identifying and Confirming a Bug with PowerShell's Invoke-WebRequest
- [x] Complete draft (2019/03)
- [x] Editing pass (2019/04)
- [ ] Post-mortem

## Bottom Line:
This article outlines the methodology I used to prove `Invoke-WebRequest` behaved abnormally.  There's no security impact from the bug, and the overall impact is still pretty minimal. If all you're interested in is the bug report, this is all you should need:

__Expected behavior:__ `Invoke-WebRequest -method post`, when encountering a redirect, should maintain user-defined attributes and submit a `POST` request to the redirect-defined URL

__Current Behavior:__ `Invoke-WebRequest -method post`, when encountering a redirect, submits a `GET` request to the redirect-defined URL

__Impact:__ Minimal, Annoying

__Workaround:__ Be exact in defining the URL

## Background
During a recent wargame challenge, my friend (let's call him Steps) had to send a POST request to a server - since he was already on Windows, he went to PowerShell, and crafted his bog-standard [`Invoke-WebRequest`](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/invoke-webrequest?view=powershell-6) 
```PowerShell
PS C:\Users\Steps> iwr -method post -uri http://heckthebox.com/api -usebasicparsing
```
But instead of a success message, he was greeted with...
```
iwr : The remote server returned an error: (405) Method Not Allowed.
```
Which was _particularly_ odd, because I had found success with `curl` moments before.  So I investigated.

## Troubleshooting
First I grabbed the error with `try`/`catch` so that I could operate on the returned object
```PowerShell
PS C:\Users\cmdr0> $response =
>> try {
>>   iwr -method post -uri http://heckthebox.com/api -usebasicparsing 
>> } catch { $_ }
```
Digging around the error object's properties with `Get-Member`, I was able to find the following snippet:
```PowerShell
PS C:\Users\cmdr0> $response.exception.response
...
StatusCode              : MethodNotAllowed
StatusDescription       : Method Not Allowed
ProtocolVersion         : 1.1
ResponseUri             : https://www.heckthebox.com/api
Method                  : GET
...
```
The `ResponseUri` had changed, now using https and including www, but the `Method` was showing as `GET` instead of `POST`.

The `ResponseUri` changing indicated that I probably hit a redirect at `http://heckthebox.com/api`, forwarding me from port 80 to port 443 with the full uri.  At this point, Steps, working in parallel to just complete the challenge, found success in `POST`-ing directly to the full https url, which bolstered my theory.

Moving to prove my hunch, I `curl`ed the partial directory and found it returning HTTP Redirect (301):
```bash
cmdr0@GANTRITHOR:~$ curl -XPOST -siL https://heckthebox.com/api
```
```
HTTP/2 301
...
location: https://www.heckthebox.com/api
...

HTTP/2 200
...
```
Pushing a `GET` request the same way gave an `HTTP 405` (Method Not Allowed) after the redirect - the same as what I saw when hitting the redirect with `Invoke-WebRequest`

The above gave me the behaviors I needed to emulate the environment and prove my hunch that `Invoke-WebRequest` wasn't treating forwards/redirects appropriately.

## Proving it
To emulate the environment, I spun up the following on my Windows machine:

- Two servers in WSL/Ubuntu shells
  - 'Fake' `nc` HTTP Redirect (301) server listening on localhost:8080 and redirecting to localhost:8081
  - 'Fake' `nc` HTTP OK (200) server listening on localhost:8081
- A subnet-adjacent PowerShell console

> **Author's note:** my original MVP actually consisted of two custom Python SimpleHTTPServers.  These worked, but `nc` worked better by not obscuring the incoming data, and is what I'll use in the future.

Here's the one-liner for my fake redirect server:
```bash
cmdr0@GANTRITHOR:~$ while true; do echo -e "HTTP/1.0 301 Moved Permanently\r\nLocation: http://127.0.0.1:8081\r\n\r\n" | nc -q1 -l 127.0.0.1:8080; done
```
In case you're not `bash`-native, here's the breakdown:
```
while true; do <STUFF>; done
```
That's my infinite loop to make sure `nc` is called again each time it exits so that my listener doesn't die at the end of the first connection.

The `-e` flag on `echo` translates `\r\n` into newlines instead of printing them literally; the `echo`'d string translates to the following:
```
HTTP/1.0 301 Moved Permanently
Location: http://127.0.0.1:8081
<INTENTIONALLY_BLANK_LINE>
```
The blank line is part of HTTP spec, indicating the end of the HTTP header.  By piping it to `nc`, the first thing `nc` does after connecting is send that across the wire.  The `q1` limits the connection time - otherwise neither side terminates the connection.

With that, you should be able to understand my near-identical second server:
```bash
cmdr0@GANTRITHOR:~$ while true; do echo -e "HTTP/1.0 200 OK\r\n\r\n" | nc -q1 -l 127.0.0.1:8081; done
```
With my environment up, I threw `iwr` at the `nc`-redirect server:
```PowerShell
PS C:\Users\cmdr0> iwr -method post -uri http://localhost:8080 -usebasicparsing
```
My 301 Redirect server got a POST request, as expected:
```
POST / HTTP/1.1
User-Agent: Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.17763.316
Content-Type: application/x-www-form-urlencoded
Host: localhost:8080
Content-Length: 0
Connection: Keep-Alive
```
But then my 200 OK server got a GET request instead:
```
GET / HTTP/1.1
User-Agent: Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.17763.316
Content-Type: application/x-www-form-urlencoded
Host: 127.0.0.1:8081
Connection: Keep-Alive
```
From here I attached my evidence to a bug report, where I'm still awaiting a response.

## Future Testing

- [ ] Check newer versions
- [ ] Check other flags (does it also drop the data/body?)
- [ ] Check [source code](https://github.com/PowerShell/PowerShell/blob/1d549497cfba144e978f3c66c4f817926afd46ef/src/Microsoft.PowerShell.Commands.Utility/commands/utility/WebCmdlet/Common/WebRequestPSCmdlet.Common.cs#L1105-L1108)
- [ ] Wait patiently for a response to my bug report