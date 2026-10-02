# Wedding Invitation

## What guests experience
1. A sealed envelope greets them by name (`?to=Name`). Tapping the wax seal opens it.
2. Both portraits form out of glowing stardust. A tap sends a shockwave through them.
3. Scrolling swirls the two portraits together into one beating heart.
4. The wedding date is hidden under gold scratch-off coins. Scratching them all reveals the date, the countdown and confetti.
5. The story timeline draws itself as they scroll.

## Personalise
1. Put photos in `assets/` as `bride.jpg` and `groom.jpg` (tall portrait crops look best).
2. Edit `config.js`: names, date, events, story, music. All current values are placeholders.

## Preview
```
cd WeddingInvitation
python3 -m http.server 8000
```
Open http://localhost:8000 (opening index.html directly will not work because it uses ES modules).

- `?to=Aunt%20Mary` greets a guest by name.
- `?open` skips the envelope, `?still` also skips the fly-in animation.

## The promise (built from the two photos)
After the heart, a white section shows both photos in arch frames. Scrolling zooms into their hands,
a gold ring flies from the groom's hand and lands on the bride's ring finger, then both faces return.
If you swap photos, update `promise.groomHand` and `promise.brideRing` in `config.js`.
These are the ring's start and landing points, as fractions of each photo's width and height.
If ring-film frames exist, the film replaces this scene.

## Ring film (scroll-scrubbed video)
After the heart, a white section plays the ring moment frame by frame as guests scroll.
1. Generate the video (16:9, static camera, pure white background, bride left, groom right).
2. Cut it into frames. This replaces any earlier frames:
   ```
   tools/make-frames.sh ~/Downloads/ring-video.mp4
   ```
3. Reload the page. The section appears automatically once the frames exist.
Captions and scroll length are in `ringFilm` in `config.js`.

## Optional 3D avatars
Export a `.glb` for each person (Avaturn, Meshy, Tripo, etc.), place it in `assets/`,
and set `bride.model` / `groom.model` in `config.js`. The avatar replaces that stardust portrait;
tapping it makes it twirl. When guests scroll, the avatar shrinks away and the stardust still forms the heart. If the file fails to load, the photo card is used.

## Publish
Any static host works: Netlify Drop, GitHub Pages, Vercel, Cloudflare Pages.
