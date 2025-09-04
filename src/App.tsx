@@ .. @@
       // Clean name: remove prefix and "48-HR", "24-HR", etc.
       let cleanedName = originalName
         .replace(/(?:ATR|TMC|P&B|QUE|ADT)-\d+[A-Z]?\s*/i, '')
         .replace(/\b\d{1,3}-HR\b/gi, '')
        .replace(/\(\d+\s+MACHINES?\)/gi, '')
        .replace(/\(\d+M\d+\)/gi, '')
         .replace(/\s{2,}/g, ' ')
         .trim();