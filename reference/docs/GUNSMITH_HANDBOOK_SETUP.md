# The Gunsmith's Book of Work

Two illustrated editions are included:

- [Printable PDF](GUNSMITH_HANDBOOK.pdf): 29 A4 pages, including 20 recipe plates, workshop narratives, ledgers, and ammunition production.
- [HTML edition](GUNSMITH_HANDBOOK.html): the printable source, referencing existing textures in `../kubejs/assets/kubejs/textures/item/`.
- In-game Patchouli edition: 27 entries and 85 pages across seven chapters. Patchouli is already installed; no additional mod is required.

The tone and page design are inspired by an old workshop handbook. All assembly instructions describe the Minecraft recipes. This is not a facsimile of a historical manual.

## Obtain the in-game book

Fully restart Minecraft after adding the new book definition. Install `patchouli_books/rustic_gunsmith/` on the server and the clients that will read the book. Keep the existing KubeJS item registrations, textures, and server recipes installed too. The book folder uses Patchouli's external-book format and its existing brown book model.

As an operator, run this in chat:

```mcfunction
/function kubejs:give_gunsmith_manual
```

The helper is in `kubejs/data/kubejs/function/give_gunsmith_manual.mcfunction` and grants a copy to the player executing it. If adding that helper to an already-running server, run `/reload`.

Alternatively, give a named player the book from the server console (substitute their username; omit the leading slash in the console):

```mcfunction
/give PlayerName patchouli:guide_book[patchouli:book="patchouli:rustic_gunsmith"] 1
```

Right-click while holding the book to open it. Start at **I. The Workshop**, then use the seven chapters to browse materials, parts, final assembly and ammunition.

No crafting recipe, loot entry, starting gift, or creative-tab entry is added for this book. It can be issued by commands or handed from one player to another. The existing flintlock recipes remain hidden from EMI/JEI; the book reads them directly to draw its crafting grids.

The book is uncraftable, not access-encrypted. Anyone receiving it can read and share it; book content files are readable on clients. Keep the PDF, HTML, source JSON and original technical manual out of public downloads if their contents should remain private.

## Checks

- PDF contains 29 pages; browser layout checks found no content overlapping footers and no missing images.
- All 35 Patchouli JSON files parse. Entries refer to the same custom recipe IDs as the server scripts.
- In-game opening, page rendering and the give command still need verification after a full restart.
- The original [technical manual](FLINTLOCK_CRAFTING_MANUAL.md) remains available for comparison.

## Editing

`docs/gunsmith_source.json` records the recipe data and workshop prose used for these editions. Recipe patterns in the book refer to server recipe IDs; PDF patterns and material ledgers are a snapshot and should be regenerated or updated when recipes change.

Patchouli references: [external book structure](https://vazkiimods.github.io/Patchouli/docs/patchouli-basics/getting-started/), [page types](https://vazkiimods.github.io/Patchouli/docs/patchouli-basics/page-types/), [book options](https://vazkiimods.github.io/Patchouli/docs/reference/book-json/).
