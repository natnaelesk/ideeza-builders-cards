# Designer frames

Drop a full-bleed background/frame here for each role (1080×1350 PNG or SVG), then point to it in `src/config/cardLayout.ts`:

```ts
roles: {
  builder: { frameSrc: '/frames/builder.png', ... },
  mentor:  { frameSrc: '/frames/mentor.png', ... },
  judge:   { frameSrc: '/frames/judge.png', ... },
}
```

For `/team` custom-role cards, set `teamRoleTemplate.frameSrc` in `src/lib/roleDisplay.ts` (e.g. `/frames/team.png`). The same slot coordinates apply.

When `frameSrc` is `null`, the app draws the built-in lavender placeholder (gradient + glassy spheres). Slot positions (photo, badge, headlines, etc.) stay in that same config file — no component edits needed.
