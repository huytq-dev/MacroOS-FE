# "To Custom" threw the user out / Create Food not prefilled (F1) — 2026-10-26

Screenshots here: `before-01/02` (prod screens the user sent: Food Detail, then Food Log), `after-01` (LocalDB, Create Food prefilled from a catalog Egg, 375 px), `after-02` (source food failed to load).

## What happens in the code
- "To Custom" on Food Detail called `onClose()` (closing the Add Food sheet) and then `router.push('/foods/new?from=<id>')`.
- The sheet is the shared `Dialog` with the committed `useBackToClose`: opening pushes a `__sheet` history entry, closing schedules a `requestAnimationFrame(() => history.back())` to remove it unless the page already navigated. The documented race: the rAF `history.back()` can run AFTER Next's `pushState`, which undoes the push. User sees the Food Log again ("thrown to the second screen") and no Create Food form.
- Create Food with `?from=` showed an empty form without any message when the source food failed to load, so a failed load also looked like "To Custom lost the food".

## Fix (FE, no BE change)
- `copyToCustom` is now `router.push(...)` only: the sheet is NOT closed first; it closes with the page unmount, so there is no rAF back competing with the push (order independent).
- Leaving the Food Log page clears the global `addFoodOpen` flag so the sheet never reopens on return.
- Create Food: a failed source load shows "Couldn't load this food" + Try again, and the empty form stays usable.
- Check `TC1` (pins all three + route passes `from`); mutation-tested.

## Verified
- LocalDB, real BE: Food Detail (catalog egg) → To Custom → `/foods/new?from=…` with name, brand, serving and macros prefilled (`after-01`); Back returns to the Food Log with the sheet closed.
- Not reproduced: the exact prod failure on a real phone (needs prod console / network logs if it still happens after this change).

## Known gaps
- Back from Create Food returns to the Food Log, not to the Food Detail (Master asked for the latter; would need keeping the sheet's state across the route change).
- The created copy has `nutrients: []` for catalog foods: only macros are prefilled (BE detail has no micronutrient list for those rows).
