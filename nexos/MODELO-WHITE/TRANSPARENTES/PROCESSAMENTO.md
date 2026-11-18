# Remoção de fundos — MODELO-WHITE

Ferramenta: image_gen integrada, modo de edição, transparent_background=true.

14 JPGs processados e salvos em PNG com canal alpha. JPGs originais preservados. Nenhuma alteração no site.

## Verificação e limitações

Todos os 14 arquivos apresentaram pixels totalmente transparentes e pixels opacos na validação de alpha. As dimensões de saída podem diferir das originais. A folha Character_turnaround_reference_s…_f7ee6f01_2K.png ainda apresenta resíduos claros nos contornos, mesmo após refinamento; requer acabamento adicional antes do uso final. Alguns outros recortes também podem exibir pequenas franjas nas bordas, especialmente sobre fundos escuros.

## Prompts utilizados

### cutoutPrompt

Use case: background-extraction. Edit the supplied photograph only: remove its entire studio background and floor, replacing them with genuine transparent alpha. Preserve the existing white-clothed masked character exactly: identity, goggles, clothing fabric, gloves, body shape, pose, lighting and green rim highlights on the subject. Keep the same framing and proportions; do not crop any part of the existing subject, do not invent missing body parts, do not redraw or stylize. Clean detailed edges and remove background between limbs. Do not make white clothes transparent. No new shadows, scenery, text, checkerboard, or extra objects. Output one transparent PNG.

### cutoutPromptStrict

Use case: background-extraction. Edit the supplied photograph only: remove its entire studio background and floor, replacing them with genuine transparent alpha. Preserve the existing white-clothed masked character exactly: identity, goggles, clothing fabric, gloves, body shape, pose, lighting and green rim highlights on the subject. Keep the same framing and proportions; do not crop any part of the existing subject, do not invent missing body parts, do not redraw or stylize. Clean detailed edges and remove background between limbs. Do not make white clothes transparent. No new shadows, scenery, text, checkerboard, or extra objects. Output one transparent PNG. IMPORTANT: This is extraction, not a new rendition: retain the original foreground appearance and anatomy. Do not alter lighting, contrast, white balance, fabric wrinkles or the strength of the original green rim light. No bright green outline, no white halo, no background-colored fringe, no edge overspray. Keep original full subject and all fingers/shoes.

### cutoutPromptKey

Use case: background-extraction. Edit the supplied photograph only. Remove the entire dark studio background and diagonal green background streaks, replacing them with genuine transparent alpha. Preserve the existing hand, white glove if present, sleeve, and complete metallic key, including its ring, shaft and teeth, exactly as in the original. Keep the original hand pose, all fingers, original framing, proportions, surface texture and photographic lighting. Keep subtle original green reflections on the foreground, but do not brighten them. Remove the background through the keyring opening and gaps between fingers. Do not invent a body, new hand, text or new objects. No scenery, floor, cast shadow, checkerboard, white outlines, bright green outlines or edge overspray. Output one transparent PNG.

### cutoutPromptLogo

Use case: background-extraction. Edit the supplied photograph only: remove the entire black/dark studio background, replacing it with genuine transparent alpha. Preserve both existing hands, the left white glove and sleeve, the right bare hand with its wristwatch, and the exact central metallic ezway registered logo. Preserve the exact lettering, letter shapes, spacing, proportions, metallic finish, all fingers, original lighting, textures and horizontal composition. Keep transparent negative spaces between hands, around the logo and within its letters. Do not redraw or reinterpret the logo, add text, invent objects, or crop any foreground. No new background, checkerboard, cast shadow, white halo or edge overspray. Output one transparent PNG.

### cutoutRefinePrompt

Use case: background-extraction. Refine the alpha matte of this existing transparent PNG, without changing the six photographed white-clothed figures. Remove ALL detached white speckles, gray/white background remnants, fuzzy halos and edge overspray around and between the six figures. Keep opaque white clothing and every body part intact. Use a tight, smooth, natural silhouette following each real figure, with only subtle antialiasing. Do not redraw, reposition, merge or crop any of the six figures. Preserve the 2 by 3 grid, all poses, goggles, fabric detail and current color. The entire area outside the six precise silhouettes must have alpha zero. Output a genuinely transparent PNG, no checkerboard and no new elements.

### cutoutPromptSheetFinal

Remove the background from this six-view character reference sheet. Deliver the same six full-body white-clothed masked characters, in exactly the same two rows and three columns, isolated on a completely transparent background. Carefully cut along the actual clothing silhouette, with absolutely no white or gray background left outside the bodies, no scattered pixels and no white outline. Keep every original pose, finger, shoe, goggle, fabric detail and proportion. The white clothing is foreground and must remain opaque. The light gray studio backdrop and floor are background and must be entirely transparent, including spaces between legs and arms. Do not add, crop, repaint or move the characters. Precise clean commercial cutout; transparent PNG.

