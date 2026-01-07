# Gusto Kiosk Tweaks

A browser extension that adds keyboard shortcuts and quality-of-life improvements to Gusto Kiosk.

Who puts an on-screen keypad that you can't use a keyboard on??? And similar oddities.

Generally the goal is you can set default values, and then press enter repeatedly to go through their pipeline filling
out the defaults.

### Build
`pnpm i && pnpm build`

Some shenanigans here. Since there are 2 targets, manifest.json is slightly tweaked in each version. 
Just keep in mind the build process changes manifest for each browser.

### Developed with firefox 
Unfortunately, due to their security through obscurity, and my silly brain, I can't move the kiosk to another browser 
without asking the company to re-verify my kiosk, and then I would have to use chrome. 
I assume it works fine though, issues are welcome.

### License
MIT

## Next step

#### CLI

Afaik, there is no cryptographic way for them to verify the sender of the request. I looked into it, and it's a mess of 
cookies, hardware fingerprinting and other tricks, but fundamentally, there is no way for them to secure this.

The KIOSK is signed in only once, so whatever session token it gets (I've never had to refresh it) could be exported and
used elsewhere. This is my next step.

#### Web UI

Maybe some styling, but I can't find a good way to stop the change from flashing the original CSS which feels too hacky.
Maybe redirect CSS queries, but they also have a lot of inline styling. IDK And tailwind hash class names are a pain.


## Their stack

Just to shame them for this minimum effort site that has lost millions of people collective years of time for a couple 
hours or work they didn't want to do?

- Ruby
- Tailwind
- Vite
- React (I think, one reference to JSX/TSX)

