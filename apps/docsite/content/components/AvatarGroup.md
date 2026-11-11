---
id: avatar-group
title: Avatar group
summary: >-
  An avatar shows an image or text to represent a person or group as well as
  give additional information like their status and activity. If you need to
  represent many avatars, try an avatar group.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=308130-4946
  - label: Fluent guidance
    url: >-
      https://fluent2.microsoft.design/components/web/react/core/avatargroup/usage
reference:
  component: components-avatargroup
  aliases: [/avatar-pie/]
---

## Behavior and states

- The avatar spread is the default configuration for multiple avatars.
- The avatar stack is a more condensed configuration in which the avatars overlap each other.
- If there are more than five people or groups to represent, the fifth avatar slot can show an overflow avatar to indicate an exact number of associated entities.
- Both the avatar spread and stack support displaying activity rings. The spread can also display presence badges.

### Avatar pie

- The avatar pie shows two to three avatars in a single circular container.
- Use the avatar pie in cases where space is extremely limited, like Teams group chats.
- The avatar pie can’t display activity or presence.
