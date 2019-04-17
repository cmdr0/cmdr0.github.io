# Identifying and Confirming a Bug with PowerShell's Invoke-WebRequest
- [x] Complete draft (2019/04)
- [ ] Editing pass
- [ ] Post-mortem

## Background
During a recent wargame challenge, my friend (let's call him Steps) had to send a POST request to a server - since he was already on Windows, he went to PowerShell, and crafted his bog-standard [`Invoke-WebRequest`](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/invoke-webrequest?view=powershell-6) 
```
PS C:\Users\Steps> iwr -method post -uri http://heckthebox.com/api -usebasicparsing
```
But instead of a success message, he was greeted with...
```
iwr : The remote server returned an error: (405) Method Not Allowed.
```
Which was _particularly_ odd, considering I had accomplished the exact same task moments before with `curl`.  So what gave?

## Troubleshooting
Let's take a look at the error's output.  First, we have to `catch` the error so that we can operate on it (newlines with shift+enter so you don't have to look at backticks).
```
PS C:\Users\cmdr0> $response =
>> try {
>>   iwr -method post -uri http://heckthebox.com/api -usebasicparsing 
>> } catch { $_ }
```
PowerShell isn't exactly my daily driver, but digging around the error object's properties with `Get-Member`, I was able to find an interesting block of info:
```
PS C:\Users\cmdr0> $response.exception.response
...
StatusCode              : MethodNotAllowed
StatusDescription       : Method Not Allowed
ProtocolVersion         : 1.1
ResponseUri             : https://www.heckthebox.com/api
Method                  : GET
...
```
The response uri had become more verbose, adding the `www.` (which makes sense, because as a large domain, you have to redirect from numerous adjacent URLs), but more importantly the `POST` method had somehow changed to `GET`

By this point, Steps had already figured out that POST-ing directly to the full domain name worked, so it was pretty obvious that there was something going on with redirection; but without proof, that's just a hunch.

Investigating a 'partial' url using `curl` gave us the following (significantly redacted):
```
cmdr0@GANTRITHOR:~$ curl -XPOST -siL https://heckthebox.com/api

HTTP/2 301
...
location: https://www.heckthebox.com/api
...

HTTP/2 200
...
```
Doing the same thing without `-XPOST` resulted in the second response being a 405 - at this point, we could narrow the problem down to `Invoke-WebRequest` and the 301 code it encountered.  After some digging in the documentation for `Invoke-WebRequest` (and its sibling, `Invoke-RestMethod`), we came to the conclusion that the two cmdlets were dropping properties when they were faced with a redirect.

## Proving it
To emulate what we know of the environment, we need:

- Two servers
  - HTTP Redirect (301) server; this will be listening on localhost:8080 and redirecting to localhost:8081
  - HTTP OK (200) server; this will be listening on localhost:8081
- IP-adjacent PowerShell console

I figured this could all be done from my Windows box, so I fired up two Ubuntu/WSL consoles, my PowerShell console, and got to work.

> **Author's note:** my original MVP actually consisted of two Python SimpleHTTPServers... and while it seems a waste not to post them here, they were actually just a fallback because I had a bug in the implementation I _wanted_, which were two `nc` one-liners _pretending_ to be HTTP servers.  I wanted `nc` because it doesn't hide or obfuscate _anything_.  Spoiler: the python servers worked to prove the concept, but I'm going to be showing the `nc` version here, since I've fixed it, and I'll be using it for future testing.

Here's our one-liner for a fake redirect server:
```
cmdr0@GANTRITHOR:~$ while true; do echo -e "HTTP/1.0 301 Moved Permanently\r\nLocation: http://127.0.0.1:8081\r\n\r\n" | nc -q1 -l 127.0.0.1:8080; done
```
I feel like that deserves some explaining.  The first part is our infinite loop (that we'll exit out of with ctrl+C later, don't worry):
```
while true; do <STUFF>; done
```
`echo -e` just means that we're translating the `\r\n` into newlines instead of printing them literally; ultimately the echo command translates to the following:
```
HTTP/1.0 301 Moved Permanently
Location: http://127.0.0.1:8081
<INTENTIONALLY_BLANK_LINE>
```
The blank line is actually part of HTTP spec, and indicates the end of the HTTP header.  That header gets piped into `nc`, which responds to _any_ request it gets with that header.  The `-q1` makes sure `nc` hangs up the phone eventually.  And with that, I'll let you decipher the near-identical second server:
```
cmdr0@GANTRITHOR:~$ while true; do echo -e "HTTP/1.0 200 OK\r\n\r\n" | nc -q1 -l 127.0.0.1:8081; done
```
With our environment up, if we throw `iwr` across the network at them using POST...
```
PS C:\Users\cmdr0> iwr -method post -uri http://localhost:8080 -usebasicparsing
```
Our 301 Redirect server gets...
```
POST / HTTP/1.1
User-Agent: Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.17763.316
Content-Type: application/x-www-form-urlencoded
Host: localhost:8080
Content-Length: 0
Connection: Keep-Alive
```
But then our 200 OK server gets...
```
GET / HTTP/1.1
User-Agent: Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.17763.316
Content-Type: application/x-www-form-urlencoded
Host: 127.0.0.1:8081
Connection: Keep-Alive
```
This was enough for me to open a bug report (well, feedback) with Microsoft, where I'm awaiting a response.

## Future Testing

Going forward, I intend to look into the cross-platform version of PowerShell to see if this flaw exists - because it's open source, I'll have access to the [source code](https://github.com/PowerShell/PowerShell/blob/1d549497cfba144e978f3c66c4f817926afd46ef/src/Microsoft.PowerShell.Commands.Utility/commands/utility/WebCmdlet/Common/WebRequestPSCmdlet.Common.cs#L1105-L1108).  If it does, I'll be able to open an issue or a pull request for it.