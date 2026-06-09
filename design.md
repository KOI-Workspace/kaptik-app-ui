---
name: Kaptik Dark
colors:
  primary: "#8353EB"
  primary-hover: "#7445DA"
  primary-active: "#6338C4"
  surface: "#050505"
  surface-card: "#191919"
  surface-elevated: "#202020"
  on-surface: "#FFFFFF"
  on-surface-muted: "#B7B7B7"
  border: "rgba(255,255,255,0.13)"
  error: "#FF625C"
typography:
  body-md:
    fontFamily: Inter, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 500
rounded:
  sm: 10px
  md: 16px
  lg: 24px
  xl: 32px
---

# Design System

## Overview
Kaptik Dark is a mobile-first dark interface for a K-pop focused AI subtitle service.
The UI should feel immersive, media-heavy, and fandom-native, while keeping Kaptik's own identity through black surfaces and the purple accent color `#8353EB`.

The design is inspired by a content platform structure: home feed, live/subtitle entry, saved expressions, DM-style alerts, shop/payment entry, more/settings, and floating AI assistant access. Do not copy exact platform logos, artist images, or user-generated content.

## Colors

- **Primary** (`#8353EB`): main CTA, active tab indicator, selected chips, verified/AI accent, floating assistant accent, progress highlights.
- **Primary Hover** (`#7445DA`): hover state for primary buttons and active icon containers.
- **Primary Active** (`#6338C4`): pressed state for primary buttons.
- **Surface** (`#050505`): full app background in dark mode.
- **Surface Card** (`#191919`): feed cards, notice cards, DM panels, settings groups.
- **Surface Elevated** (`#202020`): bottom navigation, modal panels, focused cards.
- **On-surface** (`#FFFFFF`): primary text, selected navigation labels, strong numbers.
- **On-surface Muted** (`#B7B7B7`): metadata, timestamps, helper text, inactive labels.
- **Border** (`rgba(255,255,255,0.13)`): card outlines, dividers, inactive chips.
- **Error / Notification** (`#FF625C`): unread badges, alert dots, destructive states.

### Color Usage Rules

Primary purple must be used sparingly. It should mark what is interactive, selected, or uniquely Kaptik. Do not use purple for large background surfaces unless it is inside a soft glow, gradient, or floating assistant element.

Cards and panels should stay neutral black or dark gray. Content should create contrast through spacing, image blocks, typography, and selective purple accents.

## Typography

- **Hero / Feature Title**: Inter or Pretendard, 36–40px, 900 weight, tight letter spacing.
- **Page Title**: Inter or Pretendard, 28px, 850 weight.
- **Section Title**: Inter or Pretendard, 24px, 850 weight.
- **Card Title**: Inter or Pretendard, 20–21px, 800–850 weight.
- **Body**: Inter or Pretendard, 16px, 500 weight.
- **Metadata / Caption**: Inter or Pretendard, 13–14px, 500–600 weight.
- **Micro Labels**: Inter or Pretendard, 11–12px, 700 weight.

Text should feel bold and app-like. Main labels are large and heavy. Secondary text should be muted rather than thin.

## Layout

- **Canvas**: mobile-first, optimized for 390px width.
- **Page Padding**: 20px horizontal padding.
- **Section Gap**: 28–40px between major sections.
- **Card Gap**: 12–16px between cards.
- **Bottom Safe Area**: reserve 92–112px because floating bottom navigation overlaps content.
- **Top Area**: allow generous spacing for status bar and compact brand/header area.

## Components

### App Header
Use a black background with a compact brand mark on the left and notification/search/settings icons on the right.

- Background: transparent over `#050505`
- Text/logo color: `#FFFFFF`
- Icon color: `#FFFFFF`
- Notification badge: `#FF625C`, white text, pill radius

### Top Tabs
Top tabs are text-based and bold.

- Inactive text: `#9A9A9A`
- Active text: `#FFFFFF`
- Active underline: `#FFFFFF` or `#8353EB`
- Unread dot: `#FF625C`
- Height: 44–52px

### Content Cards
Used for live cards, notices, feed posts, saved subtitles, and recommendations.

- Background: `#191919`
- Border: `1px solid rgba(255,255,255,0.08)`
- Radius: 24px
- Shadow: none or subtle `0 8px 24px rgba(0,0,0,0.28)`
- Title: white, bold
- Metadata: muted gray

Do not place heavy shadows on child elements. Depth belongs to the card container.

### Live / Subtitle Card
A large feature card for currently available live content or subtitle sessions.

- Background: dark radial gradient with purple glow
- Recommended background: `radial-gradient(circle at 50% 40%, rgba(131,83,235,0.35) 0%, rgba(25,25,25,0.95) 42%, #080808 100%)`
- Radius: 28px
- Badge: dark translucent pill with white text
- Stats row: muted icons and text
- Primary action: purple CTA

### Moment / Horizontal Media Row
Used for short clips, recent subtitle moments, or saved fan moments.

- Container background: `#191919`
- Radius: 24px
- Item image radius: 12–14px
- Profile ring / selected accent: `#8353EB`
- Label: white, bold, 14–16px

### Feed Post Card
Used for community posts, subtitle updates, and artist notices.

- Background: `#191919`
- Radius: 22–24px
- Divider: `rgba(255,255,255,0.08)`
- Interaction icons: muted by default, white when active
- Active state: purple icon or soft purple background

### Bottom Navigation
Floating pill navigation is a core visual pattern.

- Position: fixed bottom, centered
- Background: `rgba(32,32,32,0.82)`
- Backdrop filter: blur(18px)
- Border: `1px solid rgba(255,255,255,0.14)`
- Radius: 999px
- Height: 72–80px
- Selected item background: `rgba(255,255,255,0.14)` or `rgba(131,83,235,0.22)`
- Selected icon/text: `#FFFFFF`
- Inactive icon/text: `#D7D7D7`

### Floating AI Button
The floating AI button is the strongest Kaptik-owned element.

- Shape: circle, 72–84px
- Background: purple gradient
- Recommended background: `linear-gradient(135deg, #8353EB 0%, #B7A0FF 52%, #6EF0FF 100%)`
- Shadow: `0 12px 36px rgba(131,83,235,0.45)`
- Icon: white
- Position: fixed bottom-right, above safe area

### Buttons

#### Primary Button
- Background: `#8353EB`
- Text: `#FFFFFF`
- Radius: 999px or 16px depending on context
- Font: 16px, 750 weight
- Hover: `#7445DA`
- Active: `#6338C4`
- Disabled: `#2B2B2B` background, `#777777` text

#### Secondary Button
- Background: `#202020`
- Text: `#FFFFFF`
- Border: `1px solid rgba(255,255,255,0.13)`
- Hover: `#292929`

#### Text Button
- Text: `#8353EB`
- Background: transparent
- Hover: `rgba(131,83,235,0.10)`

### Chips
Used for filters, language selection, artist selection, and subtitle modes.

- Default: transparent or `#111111`
- Border: `rgba(255,255,255,0.16)`
- Text: `#FFFFFF`
- Selected background: `#FFFFFF`
- Selected text: `#050505`
- Alternative selected state: `rgba(131,83,235,0.22)` background with purple border

### Settings Panels
Settings should be grouped into large dark cards.

- Section label: muted gray, 15–16px, bold
- Panel background: `#191919`
- Radius: 20–22px
- Row height: 64–76px
- Divider: `rgba(255,255,255,0.08)`
- Value text: `#B7B7B7` or `#8353EB` when interactive

### Modal / Popup
Used for live alerts, purchase prompts, onboarding, and subtitle tips.

- Scrim: `rgba(0,0,0,0.72)`
- Modal background: `#F4F4F4` for promotional popups, or `#191919` for app-native dialogs
- Dark modal text: white
- Light promo modal text: near-black `#0B0B0B`
- Radius: 24px
- Primary action: black button for light promo modal, purple button for native modal

## States

### Hover
- Cards: slightly lighter background, no layout shift.
- Buttons: use hover token.
- Icons: opacity increases from 0.72 to 1.

### Pressed
- Buttons and nav items scale to `0.98`.
- Use active purple for primary buttons.

### Selected
- Navigation selected state must use either a soft white fill or soft purple fill.
- Selected chips can invert to white background or use purple accent depending on context.

### Disabled
- Text: `#4F4F4F`
- Background: `#2B2B2B`
- Icons: `#4B4B4B`
- Remove shadows and glows.

### Loading
- Use dark skeleton blocks.
- Base: `#141414`
- Highlight: `#242424`
- Radius should match the final component.

## Motion

- Default transition: `180ms ease-out`
- Modal enter: fade + scale from `0.96` to `1`
- Bottom nav interactions: `160ms ease-out`
- Floating AI button hover: lift by `-2px`, glow slightly stronger
- Avoid excessive bounce or playful motion; keep it premium and quick.

## Accessibility

- Maintain at least 4.5:1 contrast for body text.
- Purple on black is acceptable for icons and accents, but long text should remain white.
- Do not place muted gray text below 13px.
- Touch targets should be at least 44px high.
- Bottom navigation items and floating buttons must not overlap scrollable content.

## Do's and Don'ts

- Do use black and dark gray as the main visual base.
- Do use `#8353EB` only for Kaptik-owned actions, active states, and AI/subtitle emphasis.
- Do keep cards rounded and spacious.
- Do use blur and translucency for floating navigation.
- Don't copy Weverse logos, exact artist assets, or exact community content.
- Don't apply purple gradients to every card.
- Don't use thin typography for key labels.
- Don't mix sharp containers with highly rounded navigation in the same view.
- Don't place shadows on individual text or icons when the container already has depth.

## Implementation Notes

Use this file together with `kaptik_design.json`. The JSON file is the strict implementation source. This Markdown file explains the design intent, usage boundaries, and practical styling rules for developers.
