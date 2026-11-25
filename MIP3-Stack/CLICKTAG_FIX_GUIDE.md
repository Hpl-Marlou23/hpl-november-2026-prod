# MRAID `clickTag` / Clickthrough Fix Guide

## Root Cause
Ad network validators and MRAID scanners flag non-standard clickthrough variable fallbacks (`window.clickTag1`, `window.clickthrough`, `window.clickThrough`) as well as literal `"clickthrough"` attribute strings in the bundle.

To pass validation, **only `window.clickTag`** should be used when resolving the destination URL for `mraid.open()`.

---

## Files to Update in MIP / SIP Projects

### 1. `index.html`
In the `<head>` MRAID Click-Through Engine script, simplify `getClickTarget(u)` so it only checks `u || window.clickTag || ""`:

```diff
-      function getClickTarget(u) {
-        return u || window.clickTag || window.clickTag1 || window.clickthrough || window.clickThrough || "";
-      }
+      function getClickTarget(u) {
+        return u || window.clickTag || "";
+      }
```

---

### 2. `src/components/EndScene.jsx`
1. In `handleEndSceneClick`, remove `window.clickTag1`, `window.clickthrough`, and `window.clickThrough`.
2. Change `aria-label="End scene clickthrough"` to `aria-label="End scene overlay"` so the word `"clickthrough"` does not appear in compiled JSX.

```diff
   const mraid = window.mraid || {};
-  const clickTarget =
-    window.clickTag ||
-    window.clickTag1 ||
-    window.clickthrough ||
-    window.clickThrough ||
-    "";
+  const clickTarget = window.clickTag || "";
```

```diff
       <div
         role="button"
-        aria-label="End scene clickthrough"
+        aria-label="End scene overlay"
         onClick={handleEndSceneClick}
         onPointerDown={handleEndSceneClick}
```

---

### 3. `src/utils/playableBridge.js`
In `PlayableBridge.click(providedUrl = "")`, keep only `providedUrl || window.clickTag || ""`:

```diff
     const mraid = window.mraid || {};
     const clickTarget =
       providedUrl ||
       window.clickTag ||
-      window.clickTag1 ||
-      window.clickthrough ||
-      window.clickThrough ||
       "";
```

---

### 4. `src/components/endscene.html` (and any SIP `.html` template)
Inside `handleClickAction()`, remove the extra fallback properties so the Base64-encoded endscene payload does not contain them:

```diff
 function handleClickAction() {
   const clickTarget =
     window.clickTag ||
-    window.clickTag1 ||
-    window.clickthrough ||
-    window.clickThrough ||
     "";
```

---

## Verification Checklist
After applying the changes and running `npm run build`:

1. Search the source files to confirm no forbidden fallbacks remain:
   ```powershell
   Select-String -Path "index.html","src\components\EndScene.jsx","src\components\endscene.html","src\utils\playableBridge.js" -Pattern "clickTag1|clickthrough" -CaseSensitive:$false
   ```
2. Rebuild the single-file bundle:
   ```powershell
   npm run build
   ```

---

